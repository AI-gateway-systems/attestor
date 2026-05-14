import { randomBytes } from 'node:crypto';
import {
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { hostname } from 'node:os';
import { basename, dirname, join } from 'node:path';

const SLEEP_BUFFER = new SharedArrayBuffer(4);
const SLEEP_VIEW = new Int32Array(SLEEP_BUFFER);

function sleepSync(milliseconds: number): void {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return;
  Atomics.wait(SLEEP_VIEW, 0, 0, milliseconds);
}

interface FileLockOwner {
  pid: number;
  hostname: string;
  acquiredAtMs: number;
  acquiredAt: string;
}

function positiveIntegerEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function defaultLockTimeoutMs(): number {
  return positiveIntegerEnv('ATTESTOR_FILE_LOCK_TIMEOUT_MS', 5_000);
}

function defaultLockRetryDelayMs(): number {
  return positiveIntegerEnv('ATTESTOR_FILE_LOCK_RETRY_DELAY_MS', 25);
}

function defaultLockStaleMs(): number {
  return positiveIntegerEnv('ATTESTOR_FILE_LOCK_STALE_MS', 60_000);
}

function readLockOwner(lockPath: string): FileLockOwner | null {
  try {
    const parsed = JSON.parse(readFileSync(`${lockPath}/owner.json`, 'utf8')) as Partial<FileLockOwner>;
    if (
      typeof parsed.pid === 'number' &&
      typeof parsed.hostname === 'string' &&
      typeof parsed.acquiredAtMs === 'number' &&
      typeof parsed.acquiredAt === 'string'
    ) {
      return {
        pid: parsed.pid,
        hostname: parsed.hostname,
        acquiredAtMs: parsed.acquiredAtMs,
        acquiredAt: parsed.acquiredAt,
      };
    }
  } catch {
    // fall back to directory mtime below
  }
  return null;
}

function processAppearsAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    return code === 'EPERM';
  }
}

function lockAgeMs(lockPath: string, nowMs: number): {
  ageMs: number;
  owner: FileLockOwner | null;
} | null {
  const owner = readLockOwner(lockPath);
  if (owner) {
    return { ageMs: nowMs - owner.acquiredAtMs, owner };
  }
  try {
    return { ageMs: nowMs - statSync(lockPath).mtimeMs, owner: null };
  } catch {
    return null;
  }
}

function tryRecoverStaleLock(lockPath: string, staleMs: number): boolean {
  const age = lockAgeMs(lockPath, Date.now());
  if (!age || age.ageMs < staleMs) return false;
  if (age.owner?.hostname === hostname() && processAppearsAlive(age.owner.pid)) return false;
  rmSync(lockPath, { recursive: true, force: true });
  return true;
}

function writeLockOwner(lockPath: string): void {
  const acquiredAtMs = Date.now();
  const owner: FileLockOwner = {
    pid: process.pid,
    hostname: hostname(),
    acquiredAtMs,
    acquiredAt: new Date(acquiredAtMs).toISOString(),
  };
  writeFileSync(`${lockPath}/owner.json`, `${JSON.stringify(owner, null, 2)}\n`, { mode: 0o600 });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface AtomicTextFileWriteResult {
  readonly tempPath: string;
  readonly directoryFsynced: boolean;
  readonly orphanTempFilesRemoved: number;
}

export interface AtomicTextFileWriteOptions {
  readonly mode?: number;
  readonly cleanupOrphans?: boolean;
}

export function cleanupAtomicWriteTempFiles(path: string): number {
  const directoryPath = dirname(path);
  const targetBaseName = basename(path);
  const tempPattern = new RegExp(`^${escapeRegExp(targetBaseName)}\\.\\d+\\.[a-f0-9]{32}\\.tmp$`, 'u');
  let removed = 0;

  try {
    for (const entry of readdirSync(directoryPath)) {
      if (!tempPattern.test(entry)) continue;
      rmSync(join(directoryPath, entry), { force: true });
      removed += 1;
    }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code !== 'ENOENT') throw error;
  }

  return removed;
}

export function fsyncDirectoryBestEffort(directoryPath: string): boolean {
  let directoryFd: number | null = null;
  try {
    directoryFd = openSync(directoryPath, 'r');
    fsyncSync(directoryFd);
    return true;
  } catch {
    return false;
  } finally {
    if (directoryFd !== null) {
      try {
        closeSync(directoryFd);
      } catch {
        // Best-effort durability helper. Close failure should not mask the write.
      }
    }
  }
}

export function withFileLock<T>(
  targetPath: string,
  action: () => T,
  options?: {
    timeoutMs?: number;
    retryDelayMs?: number;
    staleMs?: number;
  },
): T {
  const lockPath = `${targetPath}.lock`;
  const timeoutMs = options?.timeoutMs ?? defaultLockTimeoutMs();
  const retryDelayMs = options?.retryDelayMs ?? defaultLockRetryDelayMs();
  const staleMs = options?.staleMs ?? defaultLockStaleMs();
  const startedAt = Date.now();

  while (true) {
    try {
      mkdirSync(lockPath);
      try {
        writeLockOwner(lockPath);
      } catch (error) {
        rmSync(lockPath, { recursive: true, force: true });
        throw error;
      }
      break;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code !== 'EEXIST') throw error;
      if (tryRecoverStaleLock(lockPath, staleMs)) continue;
      if ((Date.now() - startedAt) >= timeoutMs) {
        throw new Error(`Timed out waiting for file lock: ${lockPath}`);
      }
      sleepSync(retryDelayMs);
    }
  }

  try {
    return action();
  } finally {
    rmSync(lockPath, { recursive: true, force: true });
  }
}

export function writeTextFileAtomic(
  path: string,
  content: string,
  options: AtomicTextFileWriteOptions = {},
): AtomicTextFileWriteResult {
  const directoryPath = dirname(path);
  mkdirSync(directoryPath, { recursive: true });
  const orphanTempFilesRemoved =
    options.cleanupOrphans === false ? 0 : cleanupAtomicWriteTempFiles(path);
  const tempPath = `${path}.${process.pid}.${randomBytes(16).toString('hex')}.tmp`;
  const fd = openSync(tempPath, 'wx', options.mode ?? 0o600);
  let completed = false;
  try {
    writeSync(fd, content);
    fsyncSync(fd);
    completed = true;
  } finally {
    closeSync(fd);
    if (!completed) {
      rmSync(tempPath, { force: true });
    }
  }
  renameSync(tempPath, path);
  const directoryFsynced = fsyncDirectoryBestEffort(directoryPath);
  return { tempPath, directoryFsynced, orphanTempFilesRemoved };
}
