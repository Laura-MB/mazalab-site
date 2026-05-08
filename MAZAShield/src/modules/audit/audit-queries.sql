-- ============================================================
-- MAZA Shield — IAL DuckDB Query Layer
-- Immutable Audit Log — Consultas para Auditoría NGCB
--
-- Uso: duckdb -c ".read src/modules/audit/audit-queries.sql"
-- Requiere: data/audit/*.ndjson generados por AuditLogger.ts
-- ============================================================

-- 1. Vista base sobre todos los logs del día
CREATE OR REPLACE VIEW audit_log AS
  SELECT * FROM read_ndjson_auto(
    'data/audit-test/*.ndjson',
    union_by_name = true
  );

-- ============================================================
-- 2. RESUMEN GENERAL — primera vista para un auditor
-- ============================================================
SELECT
  COUNT(*)                                        AS total_entries,
  MIN(timestampMs)                                AS first_entry_ms,
  MAX(timestampMs)                                AS last_entry_ms,
  COUNT(DISTINCT actorId)                         AS unique_actors,
  COUNT(DISTINCT auditEventType)                  AS unique_event_types,
  SUM(CASE WHEN auditEventType = 'COLLUSION_SIGNAL_DETECTED' 
      THEN 1 ELSE 0 END)                          AS collusion_detections,
  SUM(CASE WHEN auditEventType = 'RISK_SCORE_GENERATED' 
      THEN 1 ELSE 0 END)                          AS risk_scores_generated,
  SUM(CASE WHEN auditEventType = 'CHAIN_VERIFIED' 
      THEN 1 ELSE 0 END)                          AS chain_verifications
FROM audit_log;

-- ============================================================
-- 3. DISTRIBUCIÓN POR ACTOR Y EVENTO
-- Muestra qué componente de Mother Brain generó qué
-- ============================================================
SELECT
  actorId,
  auditEventType,
  COUNT(*)                                        AS entries,
  ROUND(AVG(riskScoreSnapshot), 3)                AS avg_risk_score,
  ROUND(MIN(riskScoreSnapshot), 3)                AS min_risk_score,
  ROUND(MAX(riskScoreSnapshot), 3)                AS max_risk_score
FROM audit_log
WHERE riskScoreSnapshot IS NOT NULL
GROUP BY actorId, auditEventType
ORDER BY entries DESC;

-- ============================================================
-- 4. DETECCIONES DE COLUSIÓN — vista regulatoria NGCB
-- Esto es lo que un inspector solicitaría primero
-- ============================================================
SELECT
  entryId,
  sequenceNumber,
  epoch_ms(timestampMs)                           AS timestamp_utc,
  actorId,
  dealerId,
  playerId,
  casinoEventId,
  decisionLogic,
  riskScoreSnapshot,
  integrityHash
FROM audit_log
WHERE auditEventType = 'COLLUSION_SIGNAL_DETECTED'
ORDER BY sequenceNumber ASC;

-- ============================================================
-- 5. TIMELINE DE UN CASO — seguimiento de un dealer específico
-- Reemplaza <DEALER_ID> con el ID real a investigar
-- ============================================================
SELECT
  sequenceNumber,
  epoch_ms(timestampMs)                           AS timestamp_utc,
  auditEventType,
  actorId,
  decisionLogic,
  riskScoreSnapshot,
  previousHash,
  integrityHash
FROM audit_log
WHERE dealerId = '14486055-c873-489e-a312-2bf48ba6abac'
ORDER BY sequenceNumber ASC;

-- ============================================================
-- 6. VERIFICACIÓN DE INTEGRIDAD DE CADENA
-- Detecta gaps en la secuencia monotónica
-- Un gap indica posible eliminación de entradas
-- ============================================================
WITH numbered AS (
  SELECT
    sequenceNumber,
    LAG(sequenceNumber) OVER (ORDER BY sequenceNumber) AS prev_seq
  FROM audit_log
),
gaps AS (
  SELECT
    prev_seq,
    sequenceNumber,
    sequenceNumber - prev_seq - 1                   AS missing_entries
  FROM numbered
  WHERE prev_seq IS NOT NULL
    AND sequenceNumber - prev_seq > 1
)
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN 'CHAIN INTACT — no sequence gaps detected'
    ELSE 'WARNING — gaps detected in sequence'
  END                                               AS integrity_status,
  COUNT(*)                                          AS gap_count,
  SUM(missing_entries)                              AS total_missing_entries
FROM gaps;

-- ============================================================
-- 7. RISK SCORE DISTRIBUTION — para análisis estadístico NSF
-- ============================================================
SELECT
  CASE
    WHEN riskScoreSnapshot >= 0.8 THEN 'CRITICAL (0.8-1.0)'
    WHEN riskScoreSnapshot >= 0.6 THEN 'HIGH (0.6-0.8)'
    WHEN riskScoreSnapshot >= 0.4 THEN 'MEDIUM (0.4-0.6)'
    WHEN riskScoreSnapshot >= 0.2 THEN 'LOW (0.2-0.4)'
    ELSE 'MINIMAL (0.0-0.2)'
  END                                               AS risk_band,
  COUNT(*)                                          AS entries,
  ROUND(AVG(riskScoreSnapshot), 3)                  AS avg_score
FROM audit_log
WHERE riskScoreSnapshot IS NOT NULL
GROUP BY risk_band
ORDER BY avg_score DESC;

-- ============================================================
-- 8. ÚLTIMAS 20 ENTRADAS — vista de monitoreo en tiempo real
-- ============================================================
SELECT
  sequenceNumber,
  epoch_ms(timestampMs)                           AS timestamp_utc,
  actorId,
  auditEventType,
  LEFT(decisionLogic, 80)                         AS decision_summary,
  riskScoreSnapshot
FROM audit_log
ORDER BY sequenceNumber DESC
LIMIT 20;