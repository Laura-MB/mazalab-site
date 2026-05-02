"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { RiskAssessment } from "@/lib/api/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityResolutionPanel } from "@/components/demo/entity-resolution-panel";
import { RiskScoringPanel } from "@/components/demo/risk-scoring-panel";
import { ReportExportMenu } from "@/components/demo/report-export-menu";
import { useMazaLocale } from "@/components/providers/maza-locale-provider";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

type Props = {
  assessments: RiskAssessment[];
  showResultsNav?: boolean;
};

export function AssessmentResultsView({
  assessments,
  showResultsNav = true
}: Props) {
  const { t } = useMazaLocale();

  if (assessments.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{t.resultsTitle}</h2>
        <Badge variant="secondary">
          {assessments.length} {t.entitiesLabel}
        </Badge>
        {assessments[0]?.governance && (
          <Badge variant="outline">
            {assessments[0].governance.domain} ·{" "}
            {assessments[0].governance.rulesVersion}
          </Badge>
        )}
        <ReportExportMenu />
        {showResultsNav && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/results">
              {t.viewResults} <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="0">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted p-1">
          {assessments.map((_, i) => (
            <TabsTrigger key={i} value={String(i)} className="text-xs">
              {t.entityTab} {i + 1}
            </TabsTrigger>
          ))}
        </TabsList>
        {assessments.map((a, i) => (
          <TabsContent key={i} value={String(i)} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {a.resolvedEntity ? (
                <EntityResolutionPanel
                  resolved={a.resolvedEntity}
                  entityIndex={i}
                  targetEntityId={a.targetEntityId}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t.erNoResolvedTitle}
                    </CardTitle>
                    <CardDescription>{t.erNoResolvedDesc}</CardDescription>
                  </CardHeader>
                </Card>
              )}
              <RiskScoringPanel assessment={a} entityIndex={i} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
