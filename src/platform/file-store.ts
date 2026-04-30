import { randomBytes } from 'node:crypto';
import {
  closeSync,
  fsyncSync,
  mkdirSync,
  openSync,
  renameSync,
  rmSync,
  writeSync,
} from 'node:fs';
import { dirname } from 'node:path';

const SLEEP_BUFFER = new SharedArrayBuffer(4);
const SLEEP_VIEW = new Int32Array(SLEEP_BUFFER);

function sleepSync(milliseconds: number): void {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return;
  Atomics.wait(SLEEP_VIEW, 0, 0, milliseconds);
}

export function withFileLock<T>(
  targetPath: string,
  action: () => T,
  options?: {
    timeoutMs?: number;
    retryDelayMs?: number;
  },
): T {
  const lockPath = `${targetPath}.lock`;
  const timeoutMs = options?.timeoutMs ?? 5_000;
  const retryDelayMs = options?.retryDelayMs ?? 25;
  const startedAt = Date.now();

  while (true) {
    try {
      mkdirSync(lockPath);
      break;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | undefined)?.code;
      if (code !== 'EEXIST') throw error;
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

export function writeTextFileAtomic(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${process.pid}.${randomBytes(16).toString('hex')}.tmp`;
  const fd = openSync(tempPath, 'wx', 0o600);
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
}
