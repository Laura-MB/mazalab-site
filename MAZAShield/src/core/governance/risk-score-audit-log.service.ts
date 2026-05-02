import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "../../integrations/supabase/client.js";
import { logger as defaultLogger } from "../observability/logger.js";
import type { RiskScoreAuditLogRow } from "./types.js";

/**
 * Append-only audit trail for individual risk-score calculations.
 *
 * Backed by Supabase when configured; falls back to an in-memory store for
 * local development and unit tests. Use {@link getSharedRiskScoreAuditLogService}
 * to obtain the process-wide instance so that every {@link RiskScoringService}
 * (general + gaming variants) writes to the same append-only log.
 */
export class RiskScoreAuditLogService {
  private readonly memoryStore: RiskScoreAuditLogRow[] = [];
  private readonly log = defaultLogger.child({ service: "risk-score-audit" });

  constructor(
    private readonly supabase: SupabaseClient | null,
    private readonly useInMemoryFallback = false
  ) {}

  async append(entry: RiskScoreAuditLogRow): Promise<void> {
    if (this.useInMemoryFallback || !this.supabase) {
      this.memoryStore.push({ ...entry });
      return;
    }

    const { error } = await this.supabase.from("audit_logs").insert(entry);
    if (error) {
      this.log.error("Append to risk-score audit failed", {
        code: error.code,
        message: error.message
      });
      throw new Error(`Failed to append audit log: ${error.message}`);
    }
  }

  async getByCorrelationId(correlationId: string): Promise<RiskScoreAuditLogRow[]> {
    if (this.useInMemoryFallback || !this.supabase) {
      return this.memoryStore
        .filter((entry) => entry.correlation_id === correlationId)
        .slice()
        .reverse();
    }

    const { data, error } = await this.supabase
      .from("audit_logs")
      .select("*")
      .eq("correlation_id", correlationId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to read audit logs: ${error.message}`);
    }
    return (data ?? []) as RiskScoreAuditLogRow[];
  }
}

let sharedRiskScoreAuditLog: RiskScoreAuditLogService | null = null;

/**
 * Single process-wide {@link RiskScoreAuditLogService} used as the default
 * sink for every {@link RiskScoringService} that was not constructed with an
 * explicit collaborator. This guarantees one consistent append-only log
 * across the `general` and `gaming` scorers instantiated within the
 * assessment pipeline.
 */
export function getSharedRiskScoreAuditLogService(): RiskScoreAuditLogService {
  if (!sharedRiskScoreAuditLog) {
    const supabase = getSupabaseClient();
    sharedRiskScoreAuditLog = supabase
      ? new RiskScoreAuditLogService(supabase)
      : new RiskScoreAuditLogService(null, true);
  }
  return sharedRiskScoreAuditLog;
}

/**
 * Backward-compatible factory that now delegates to the process-wide
 * singleton so every caller shares the same audit store. Kept for API
 * stability; new code should prefer {@link getSharedRiskScoreAuditLogService}.
 */
export function createDefaultRiskScoreAuditLogService(): RiskScoreAuditLogService {
  return getSharedRiskScoreAuditLogService();
}

/**
 * Test-only helper: clears the cached singleton so each test can install a
 * fresh backing store. Prefixed with double underscore to signal internal
 * use; not exported from the module barrel.
 */
export function __resetSharedRiskScoreAuditLogServiceForTests(): void {
  sharedRiskScoreAuditLog = null;
}
