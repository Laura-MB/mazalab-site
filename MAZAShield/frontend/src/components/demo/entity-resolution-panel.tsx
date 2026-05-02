"use client";

import { Users, GitMerge, ArrowRight, Scale } from "lucide-react";
import type { ResolvedEntity } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMazaLocale } from "@/components/providers/maza-locale-provider";
import type { MazaStrings } from "@/lib/i18n/maza-shield-strings";

function strategyVariant(
  s: ResolvedEntity["matchStrategy"]
): "default" | "secondary" | "outline" {
  if (s === "deterministic") return "secondary";
  if (s === "probabilistic") return "outline";
  return "default";
}

function strategyLabel(
  s: ResolvedEntity["matchStrategy"],
  t: MazaStrings
): string {
  if (s === "deterministic") return t.strategyDeterministic;
  if (s === "probabilistic") return t.strategyProbabilistic;
  return t.strategyHybrid;
}

export function EntityResolutionPanel({
  resolved,
  entityIndex,
  targetEntityId
}: {
  resolved: ResolvedEntity;
  entityIndex: number;
  targetEntityId: string;
}) {
  const { t } = useMazaLocale();
  const { canonicalEntity, matchScore, matchStrategy, explanation, conflicts } =
    resolved;

  const similarityPct = Math.min(100, Math.max(0, matchScore * 100));
  const canonicalId = canonicalEntity.id;
  const showPairRow = targetEntityId !== canonicalId;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            {t.erTitle} · #{entityIndex + 1}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="tabular-nums">
              {t.erSimilarity} {similarityPct.toFixed(1)}%
            </Badge>
            <Badge variant={strategyVariant(matchStrategy)}>
              {strategyLabel(matchStrategy, t)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Scale className="h-3 w-3" />
            {t.erMatchConfidence}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${similarityPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t.erMatchHelp}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.erPair}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <span className="font-mono text-xs">{targetEntityId}</span>
            {showPairRow && (
              <>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-mono text-xs font-medium text-foreground">
                  {canonicalId}
                </span>
              </>
            )}
            {!showPairRow && (
              <span className="text-xs text-muted-foreground">{t.erSameId}</span>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.erCanonical}
          </p>
          <p className="text-base font-semibold">{canonicalEntity.displayName}</p>
          <p className="font-mono text-xs text-muted-foreground">{canonicalId}</p>
          {canonicalEntity.aliases.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{t.erAliases} </span>
              {canonicalEntity.aliases.join(", ")}
            </p>
          )}
        </div>

        <div>
          <p className="mb-1 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <GitMerge className="h-3 w-3" />
            {t.erMergedIds}
          </p>
          {resolved.mergedEntityIds.length > 0 ? (
            <ul className="space-y-1 text-sm">
              {resolved.mergedEntityIds.map((id) => (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded border bg-background px-2 py-1 font-mono text-xs"
                >
                  <span className="text-muted-foreground">∪</span> {id}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t.erNoMerges}</p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t.erExplanation}
          </p>
          <ScrollArea className="mt-1 max-h-44 rounded-md border bg-muted/30 p-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {explanation}
            </p>
          </ScrollArea>
        </div>

        {conflicts.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t.erConflictsTitle}
              </p>
              <p className="mb-2 text-xs text-muted-foreground">
                {t.erConflictsHelp}
              </p>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 font-medium">{t.colField}</th>
                      <th className="p-2 font-medium">{t.colPairValues}</th>
                      <th className="p-2 font-medium">{t.colSelected}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conflicts.map((c) => (
                      <tr key={c.field} className="border-t">
                        <td className="p-2 font-mono text-xs">{c.field}</td>
                        <td className="p-2 text-xs">{c.values.join(" · ")}</td>
                        <td className="p-2 text-xs font-medium">
                          {c.selectedValue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
