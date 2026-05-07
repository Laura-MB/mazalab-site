-- ============================================================
-- MAZA Shield — Synthetic Data Validation Script
-- Run with: duckdb -c ".read validate.sql"
-- ============================================================

-- 1. Apunta al dataset más reciente
CREATE OR REPLACE VIEW casino_events AS
  SELECT * FROM read_ndjson_auto(
    'data/synthetic/*/events_*.ndjson',
    union_by_name = true
  );

-- ============================================================
-- 2. SANITY CHECK — distribución de eventos
-- ============================================================
SELECT
  eventType,
  COUNT(*)                          AS total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS pct
FROM casino_events
GROUP BY eventType
ORDER BY total DESC;

-- ============================================================
-- 3. COVERT CHANNEL — el resultado científico central
-- Hipótesis: dealers colludidos tienen MENOR stddev en
-- deltaFromDealStartMs porque encodean señales cuantizadas.
-- ============================================================
SELECT
  _isCollusionEvent                          AS is_collusion,
  COUNT(*)                                   AS peek_events,
  ROUND(AVG(deltaFromDealStartMs), 2)        AS avg_delta_ms,
  ROUND(STDDEV(deltaFromDealStartMs), 2)     AS stddev_delta_ms,
  ROUND(MIN(deltaFromDealStartMs), 2)        AS min_delta_ms,
  ROUND(MAX(deltaFromDealStartMs), 2)        AS max_delta_ms
FROM casino_events
WHERE eventType = 'HOLE_CARD_PEEK'
  AND deltaFromDealStartMs IS NOT NULL
GROUP BY _isCollusionEvent
ORDER BY is_collusion;

-- ============================================================
-- 4. WIN RATE — ventaja estadística de jugadores colludidos
-- Resultado esperado: win rate ~5-12% mayor en colusión
-- ============================================================
SELECT
  _isCollusionEvent                          AS is_collusion,
  outcome,
  COUNT(*)                                   AS hands,
  ROUND(COUNT(*) * 100.0 /
    SUM(COUNT(*)) OVER (PARTITION BY _isCollusionEvent), 2) AS pct
FROM casino_events
WHERE eventType = 'HAND_OUTCOME'
GROUP BY _isCollusionEvent, outcome
ORDER BY _isCollusionEvent, pct DESC;

-- ============================================================
-- 5. BET MODIFICATION — patrón de modificación de apuestas
-- Colludidos deben modificar más frecuentemente y con mayor delta
-- ============================================================
SELECT
  _isCollusionEvent                          AS is_collusion,
  COUNT(*)                                   AS modifications,
  ROUND(AVG(betAmountUsd), 2)                AS avg_modified_bet_usd
FROM casino_events
WHERE eventType = 'PLAYER_BET_MODIFIED'
GROUP BY _isCollusionEvent;

-- ============================================================
-- 6. TOKE PATTERN — propinas como señal de relación
-- Colludidos dan propinas más consistentes post-victoria
-- ============================================================
SELECT
  _isCollusionEvent                          AS is_collusion,
  COUNT(*)                                   AS tokes,
  ROUND(AVG(betAmountUsd), 2)                AS avg_toke_usd,
  ROUND(STDDEV(betAmountUsd), 2)             AS stddev_toke_usd
FROM casino_events
WHERE eventType = 'TOKE'
GROUP BY _isCollusionEvent
ORDER BY is_collusion;

-- ============================================================
-- 7. RESUMEN EJECUTIVO — para el deck del NSF
-- ============================================================
SELECT
  COUNT(*)                                              AS total_events,
  COUNT(DISTINCT sessionId)                             AS total_sessions,
  COUNT(DISTINCT dealerId)                              AS unique_dealers,
  COUNT(DISTINCT playerId)                              AS unique_players,
  SUM(CASE WHEN _isCollusionEvent THEN 1 ELSE 0 END)   AS collusion_events,
  ROUND(SUM(CASE WHEN _isCollusionEvent THEN 1.0 ELSE 0 END)
    / COUNT(*) * 100, 3)                                AS collusion_pct
FROM casino_events;