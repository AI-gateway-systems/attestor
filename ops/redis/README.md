# Redis Recovery Bundle

This bundle configures Redis durability for Attestor BullMQ and shared runtime state.

The reference config enables:

- AOF persistence (`appendonly yes`)
- `appendfsync everysec` for a practical durability/latency balance
- RDB snapshots as an additional checkpoint layer
- Redis protected mode
- an ACL file with the default user disabled and an `attestor` user generated
  by the DR compose profile
- dangerous administrative commands disabled in the shipped reference config

The DR compose profile writes `/run/redis/users.acl` at container start from
`ATTESTOR_REDIS_DR_PASSWORD` and wires API/worker `REDIS_URL` values to the
authenticated `attestor` user. The default password is for local rehearsal only;
set `ATTESTOR_REDIS_DR_PASSWORD` for any shared environment.

## BullMQ recovery expectation

With Redis persistence enabled, queued BullMQ jobs and tenant execution/rate-limit state survive Redis restarts according to Redis durability guarantees.

Boundary:

- in-flight jobs can be retried or re-marked stalled by BullMQ after process loss
- this is not exactly-once processing
- the in-process fallback path still has no durable recovery
- Redis authentication is a second layer behind NetworkPolicy or equivalent
  network isolation. It does not replace live proof that only intended runtime
  pods can reach Redis.
