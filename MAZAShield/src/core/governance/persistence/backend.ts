import type { AuditLogEntry } from "../types.js";

/**
 * Persistence contract every audit-log backend must satisfy.
 *
 * The audit service holds the canonical in-memory state and asks the
 * backend to either restore it on startup or persist a snapshot after
 * every successful append / prune. The contract is intentionally narrow
 * so that swapping a JSON file for SQLite (or, later, Postgres) does not
 * leak persistence concerns into the service layer.
 *
 * Implementations MUST be safe to call concurrently from a single
 * `AuditLogService` instance (the service serialises calls through its
 * internal `opChain`, so backends only need to worry about consistency
 * relative to the filesystem / database, not about overlapping invocations
 * from the same service).
 */
export interface AuditLogPersistenceBackend {
  /**
   * Synchronous bootstrap path. Used by callers that want the audit log
   * fully hydrated before the constructor returns (the historical JSON
   * behaviour preserved here for back-compat).
   *
   * Implementations that cannot meaningfully bootstrap synchronously
   * (e.g. a future async-only backend) may throw; the service will then
   * fall back to {@link bootstrap}.
   */
  bootstrapSync(): AuditLogEntry[];

  /**
   * Asynchronous bootstrap path. Called when the service explicitly
   * reloads from disk (`load()` on the `AuditLogService` instance).
   */
  bootstrap(): Promise<AuditLogEntry[]>;

  /**
   * Persists the full snapshot of in-memory entries. Implementations are
   * free to optimise (e.g. SQLite computes the row delta and only writes
   * the difference); the service itself never asserts on the on-disk
   * shape.
   */
  persist(entries: ReadonlyArray<AuditLogEntry>): Promise<void>;

  /** Short human-readable description used in logs and diagnostics. */
  describe(): string;

  /**
   * Optional teardown hook. Backends that hold expensive resources
   * (database connections, file handles) should release them here.
   */
  close?(): Promise<void> | void;
}
