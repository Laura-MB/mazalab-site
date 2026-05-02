import type { RiskAssessment } from "@/lib/api/types";
import {
  type MazaLocale,
  getMazaStrings,
  riskLevelLabel
} from "@/lib/i18n/maza-shield-strings";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ReportDetail = "short" | "long";

function buildLongSections(a: RiskAssessment, t: ReturnType<typeof getMazaStrings>): string {
  const { riskScore, resolvedEntity } = a;

  const parts: string[] = [];

  if (resolvedEntity) {
    const sim = (resolvedEntity.matchScore * 100).toFixed(1);
    const strat =
      resolvedEntity.matchStrategy === "deterministic"
        ? t.strategyDeterministic
        : resolvedEntity.matchStrategy === "probabilistic"
          ? t.strategyProbabilistic
          : t.strategyHybrid;
    parts.push(`<h3>${escapeHtml(t.printEntityResolution)}</h3>`);
    parts.push(
      `<p><strong>${escapeHtml(t.printCanonical)}:</strong> ${escapeHtml(resolvedEntity.canonicalEntity.displayName)} (${escapeHtml(resolvedEntity.canonicalEntity.id)})</p>`
    );
    parts.push(
      `<p><strong>${escapeHtml(t.printMatch)}:</strong> ${escapeHtml(sim)}% · <strong>${escapeHtml(t.printStrategy)}:</strong> ${escapeHtml(strat)}</p>`
    );
    parts.push(
      `<div class="block"><strong>${escapeHtml(t.printExplanation)} (ER)</strong><p>${escapeHtml(resolvedEntity.explanation)}</p></div>`
    );
  }

  parts.push(`<h3>${escapeHtml(t.printDimensions)}</h3>`);
  parts.push(`<table class="dim"><thead><tr>
    <th>${escapeHtml(t.colDimension)}</th>
    <th>${escapeHtml(t.colScore)}</th>
    <th>${escapeHtml(t.colWeight)}</th>
    <th>${escapeHtml(t.colContrib)}</th>
    <th>${escapeHtml(t.colJustification)}</th>
  </tr></thead><tbody>`);
  for (const c of riskScore.components) {
    parts.push(`<tr>
      <td>${escapeHtml(c.dimension.replace(/_/g, " "))}</td>
      <td>${(c.score * 100).toFixed(1)}%</td>
      <td>${c.weight.toFixed(2)}</td>
      <td>${(c.contribution * 100).toFixed(1)}%</td>
      <td>${escapeHtml(c.justification)}</td>
    </tr>`);
  }
  parts.push(`</tbody></table>`);

  if (riskScore.explanation) {
    parts.push(
      `<h3>${escapeHtml(t.printExplanation)}</h3><p class="pre">${escapeHtml(riskScore.explanation)}</p>`
    );
  }

  if (
    riskScore.gamingInsights &&
    riskScore.gamingInsights.detectedCombos.length > 0
  ) {
    parts.push(`<h3>${escapeHtml(t.printGaming)}</h3><ul>`);
    for (const c of riskScore.gamingInsights.detectedCombos) {
      parts.push(
        `<li><strong>${escapeHtml(c.label)}</strong> (+${(c.synergy * 100).toFixed(1)}% ${escapeHtml(t.synergyPct)}) — ${escapeHtml(c.analystNote)}</li>`
      );
    }
    parts.push(`</ul>`);
    parts.push(
      `<p>${escapeHtml(t.totalSynergyBoost)} ${(riskScore.gamingInsights.synergyBoost * 100).toFixed(2)}%</p>`
    );
  }

  if (a.recommendedActions.length > 0) {
    parts.push(`<h3>${escapeHtml(t.printRecommendations)}</h3><ul>`);
    for (const act of a.recommendedActions) {
      parts.push(`<li>${escapeHtml(act)}</li>`);
    }
    parts.push(`</ul>`);
  }

  return parts.join("");
}

/**
 * Informe imprimible (PDF vía «Guardar como PDF» del navegador).
 * Versión corta: resumen por entidad. Versión larga: ER, tablas, explicaciones y recomendaciones.
 */
export function openAssessmentReportPrintView(
  assessments: RiskAssessment[],
  options?: {
    correlationId?: string;
    generatedAt?: string;
    detail?: ReportDetail;
    locale?: MazaLocale;
  }
): void {
  const detail: ReportDetail = options?.detail ?? "short";
  const locale: MazaLocale = options?.locale ?? "es";
  const t = getMazaStrings(locale);

  const rows = assessments
    .map((a, i) => {
      const score = a.riskScore.overall * 100;
      const level = riskLevelLabel(a.riskScore.level, t);
      const name =
        a.resolvedEntity?.canonicalEntity.displayName ?? a.targetEntityId;
      const summary = a.assessmentSummary
        ? `<p><strong>${escapeHtml(t.printSummary)}:</strong> ${escapeHtml(a.assessmentSummary)}</p>`
        : "";
      const gov = a.governance
        ? `<p class="meta-line"><strong>${escapeHtml(t.printGovernance)}</strong> ${escapeHtml(a.governance.domain)} · ${escapeHtml(a.governance.rulesVersion)}</p>`
        : "";

      const head = `<section class="entity"><h2>${escapeHtml(t.entityTab)} ${i + 1}: ${escapeHtml(name)}</h2>
      <p><strong>${escapeHtml(t.printRiskLevel)}</strong> ${escapeHtml(level)} · <strong>${escapeHtml(t.printScore)}</strong> ${score.toFixed(1)} / 100</p>
      ${summary}
      ${gov}`;

      if (detail === "short") {
        return `${head}</section>`;
      }

      const long = buildLongSections(a, t);
      return `${head}${long}</section>`;
    })
    .join("");

  const metaParts: string[] = [];
  if (options?.generatedAt) {
    metaParts.push(
      `<strong>${escapeHtml(t.printGenerated)}</strong> ${escapeHtml(options.generatedAt)}`
    );
  }
  if (options?.correlationId) {
    metaParts.push(
      `<strong>${escapeHtml(t.printCorrelationId)}</strong> ${escapeHtml(options.correlationId)}`
    );
  }
  const meta =
    metaParts.length > 0
      ? `<div class="meta">${metaParts.join("<br/>")}</div>`
      : "";

  const html = `<!DOCTYPE html><html lang="${locale}"><head><meta charset="utf-8"/><title>${escapeHtml(t.printTitle)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: #111; max-width: 720px; margin: 24px auto; padding: 0 16px; line-height: 1.5; }
    h1 { font-size: 1.25rem; margin-bottom: 0.25rem; font-weight: 700; }
    .meta { font-size: 0.875rem; color: #555; margin-bottom: 1.25rem; }
    .entity { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #ddd; }
    .entity:last-child { border-bottom: none; }
    h2 { font-size: 1.05rem; margin: 0 0 0.5rem; font-weight: 600; }
    h3 { font-size: 0.95rem; margin: 1rem 0 0.35rem; font-weight: 600; }
    p { margin: 0.35rem 0; }
    .meta-line { font-size: 0.85rem; color: #555; }
    .pre { white-space: pre-wrap; font-size: 0.9rem; }
    table.dim { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin: 0.5rem 0; }
    table.dim th, table.dim td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
    table.dim th { background: #f3f4f6; }
    @media print { body { margin: 0; max-width: none; } }
  </style></head><body>
  <h1>${escapeHtml(t.printTitle)} · ${escapeHtml(detail === "short" ? t.printVariantShort : t.printVariantLong)}</h1>
  ${meta}
  ${rows}
  </body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer");
  if (!w) {
    window.alert(
      locale === "en"
        ? "Allow pop-ups to export the report."
        : "Permite ventanas emergentes para exportar el informe."
    );
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();

  const triggerPrint = () => {
    try {
      w.print();
    } catch {
      /* ignore */
    }
  };
  if (w.document.readyState === "complete") {
    requestAnimationFrame(triggerPrint);
  } else {
    w.addEventListener("load", triggerPrint, { once: true });
  }
}
