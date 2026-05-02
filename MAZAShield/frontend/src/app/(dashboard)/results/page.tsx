"use client";

import Link from "next/link";
import { useAssessment } from "@/components/providers/assessment-provider";
import { AssessmentResultsView } from "@/components/demo/assessment-results-view";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export default function ResultsPage() {
  const { assessments, status, lastRunAt } = useAssessment();

  if (assessments.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Results</h1>
          <p className="mt-1 text-muted-foreground">
            Últimos resultados de{" "}
            <code className="rounded bg-muted px-1 text-sm">POST /assess-risk</code>.
            Ejecuta una evaluación en <strong>Demo</strong> para ver datos aquí.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sin resultados</CardTitle>
            <CardDescription>
              {status === "loading"
                ? "Cargando…"
                : "Los resultados de la sesión aparecen tras completar una demo."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/demo">Ir a Demo</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Results</h1>
          <p className="mt-1 text-muted-foreground">
            Último lote evaluado.
            {lastRunAt && (
              <span className="ml-2 font-mono text-xs">
                {new Date(lastRunAt).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/demo">Nueva evaluación</Link>
        </Button>
      </div>
      <AssessmentResultsView assessments={assessments} showResultsNav={false} />
    </div>
  );
}
