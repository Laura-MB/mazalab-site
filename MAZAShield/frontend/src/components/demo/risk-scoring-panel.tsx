"use client";

import { Gauge, ListChecks, MessageSquare } from "lucide-react";
import type { RiskAssessment, RiskLevel } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMazaLocale } from "@/components/providers/maza-locale-provider";
import { riskLevelLabel } from "@/lib/i18n/maza-shield-strings";

function levelVariant(level: RiskLevel): "secondary" | "outline" | "danger" {
  switch (level) {
    case "low":
    case "medium":
      return "secondary";
    case "high":
      return "outline";
    case "critical":
      return "danger";
    default:
      return "secondary";
  }
}

export function RiskScoringPanel({
  assessment,
  entityIndex
}: {
  assessment: RiskAssessment;
  entityIndex: number;
}) {
  const { t } = useMazaLocale();
  const { riskScore, assessmentSummary, recommendedActions } = assessment;
  const { overall, level, components, explanation, gamingInsights } = riskScore;

  const overallPct = Math.min(100, Math.max(0, overall * 100));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="h-5 w-5 text-primary" />
            {t.riskTitle} · #{entityIndex + 1}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {overallPct.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">{t.riskPer100}</span>
            <Badge variant={levelVariant(level)}>{riskLevelLabel(level, t)}</Badge>
          </div>
        </div>
        <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        {assessmentSummary && (
          <p className="mt-3 text-sm text-muted-foreground">{assessmentSummary}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.dimensionBreakdown}
          </p>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 font-medium">{t.colDimension}</th>
                  <th className="p-2 font-medium">{t.colScore}</th>
                  <th className="p-2 font-medium">{t.colWeight}</th>
                  <th className="p-2 font-medium">{t.colContrib}</th>
                  <th className="p-2 font-medium">{t.colJustification}</th>
                </tr>
              </thead>
              <tbody>
                {components.map((c) => (
                  <tr key={c.dimension} className="border-t align-top">
                    <td className="p-2 capitalize whitespace-nowrap">
                      {c.dimension.replace(/_/g, " ")}
                    </td>
                    <td className="p-2 tabular-nums whitespace-nowrap">
                      {(c.score * 100).toFixed(1)}%
                    </td>
                    <td className="p-2 tabular-nums whitespace-nowrap">
                      {c.weight.toFixed(2)}
                    </td>
                    <td className="p-2 tabular-nums whitespace-nowrap">
                      {(c.contribution * 100).toFixed(1)}%
                    </td>
                    <td className="p-2 text-xs leading-snug text-muted-foreground">
                      {c.justification}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {explanation && (
          <div>
            <p className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {t.analyticExplanation}
            </p>
            <ScrollArea className="mt-1 max-h-52 rounded-md border bg-muted/30 p-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {explanation}
              </p>
            </ScrollArea>
          </div>
        )}

        {gamingInsights && gamingInsights.detectedCombos.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t.gamingCombos}
            </p>
            <ul className="space-y-2 text-sm">
              {gamingInsights.detectedCombos.map((c) => (
                <li key={c.id} className="rounded-md border bg-background p-2">
                  <span className="font-medium">{c.label}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    (+{(c.synergy * 100).toFixed(1)}% {t.synergyPct})
                  </span>
                  <p className="text-xs text-muted-foreground">{c.analystNote}</p>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.totalSynergyBoost}{" "}
              {(gamingInsights.synergyBoost * 100).toFixed(2)}%
            </p>
          </div>
        )}

        {recommendedActions.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ListChecks className="h-3 w-3" />
                {t.recommendations}
              </p>
              <ul className="space-y-2">
                {recommendedActions.map((a, i) => (
                  <li
                    key={i}
                    className="flex gap-2 rounded-md border bg-muted/30 py-2 pl-3 pr-2 text-sm leading-snug"
                  >
                    <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
