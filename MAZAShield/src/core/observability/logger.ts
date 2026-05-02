import { createLogger as winstonCreateLogger, format, transports, type Logger } from "winston";

/**
 * Production-track structured logger used by every new code path that
 * needs observable output. Two output formats are supported:
 *
 *   - **production**: single-line JSON, ready for log aggregation
 *     (Datadog, Loki, CloudWatch, etc.). Every record carries a UTC
 *     timestamp, level, service name, and any bound metadata.
 *   - **development**: colourised, human-friendly single line — kept
 *     close to a classic `console.log` for fast local iteration.
 *
 * The `serviceName` and `correlationId` are propagated through winston
 * **child loggers**, so callers never need to thread the context by hand:
 *
 * ```ts
 * const log = createLogger("audit-log");
 * const requestLog = log.child({ correlationId: "abc-123" });
 * requestLog.info("appended entry", { entries: 42 });
 * ```
 *
 * The default level is read from `LOG_LEVEL` (env), falling back to
 * `info`. The current Node environment is read from `NODE_ENV`,
 * defaulting to `development`.
 */

const DEFAULT_LEVEL = "info";
const DEFAULT_SERVICE = "mazalab-core";

/** Resolves the active log level with a sensible default. */
function resolveLevel(): string {
  const raw = (process.env.LOG_LEVEL ?? "").trim().toLowerCase();
  return raw.length > 0 ? raw : DEFAULT_LEVEL;
}

/** Returns true when the runtime is configured for production. */
function isProduction(): boolean {
  return (process.env.NODE_ENV ?? "").trim().toLowerCase() === "production";
}

/**
 * JSON formatter for production. Always emits an ISO-8601 UTC timestamp,
 * preserves splat metadata, and writes errors with their stack so log
 * pipelines can index on `error.stack`.
 */
const productionFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
);

/**
 * Pretty formatter for local development. Compact one-liner with
 * colourised level and any bound context appended as a JSON tail.
 */
const developmentFormat = format.combine(
  format.colorize({ level: true }),
  format.timestamp({ format: "HH:mm:ss.SSS" }),
  format.splat(),
  format.printf((info) => {
    const { timestamp, level, message, service, correlationId, ...rest } = info as Record<
      string,
      unknown
    > & { timestamp: string; level: string; message: unknown };
    const tag = service ? `[${String(service)}]` : "";
    const corr = correlationId ? ` (cid=${String(correlationId)})` : "";
    const extraEntries = Object.entries(rest).filter(([key]) => key !== "stack");
    const extra = extraEntries.length > 0 ? ` ${JSON.stringify(Object.fromEntries(extraEntries))}` : "";
    const stack = typeof rest.stack === "string" ? `\n${rest.stack}` : "";
    return `${timestamp} ${level} ${tag}${corr} ${String(message)}${extra}${stack}`;
  })
);

/**
 * Builds a fresh winston instance. Exposed for tests and for cases where
 * a caller needs a logger with custom default metadata that should not be
 * inherited from {@link logger}.
 */
export function createLogger(serviceName: string = DEFAULT_SERVICE, defaults: Record<string, unknown> = {}): Logger {
  return winstonCreateLogger({
    level: resolveLevel(),
    defaultMeta: { service: serviceName, ...defaults },
    format: isProduction() ? productionFormat : developmentFormat,
    transports: [
      new transports.Console({
        // Errors and warnings go to stderr; everything else to stdout —
        // matches twelve-factor expectations.
        stderrLevels: ["error", "warn"]
      })
    ]
  });
}

/**
 * Default process-wide logger. Most call sites should import this and
 * derive a child logger via `logger.child({ correlationId, ... })` rather
 * than constructing a new instance.
 */
export const logger: Logger = createLogger();

/**
 * Convenience helper for callers that want a child logger bound to a
 * correlation id without juggling the metadata object themselves.
 *
 * @param correlationId - The correlation id to bind. Falsy values are
 *   ignored and the parent logger is returned unchanged.
 * @param parent - Optional parent logger; defaults to the process-wide
 *   {@link logger}.
 */
export function withCorrelationId(correlationId: string | undefined | null, parent: Logger = logger): Logger {
  if (!correlationId) return parent;
  return parent.child({ correlationId });
}

export type { Logger } from "winston";
