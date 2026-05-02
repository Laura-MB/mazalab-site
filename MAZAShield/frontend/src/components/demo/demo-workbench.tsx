"use client";

import { useState } from "react";
import { Loader2, Play, AlertCircle } from "lucide-react";
import { assessRisk } from "@/lib/api/assess-risk-client";
import type { AssessRiskRequestBody } from "@/lib/api/types";
import { getDemoAssessRiskPayload } from "@/lib/demo/sample-payload";
import { parseUploadFile } from "@/lib/parsers/ingest";
import { useAssessment } from "@/components/providers/assessment-provider";
import { useMazaLocale } from "@/components/providers/maza-locale-provider";
import { getClientApiBaseHint, DEFAULT_API_BASE } from "@/lib/config";
import { formatApiAssessError } from "@/lib/i18n/maza-shield-strings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUploadZone } from "@/components/demo/file-upload-zone";
import { AssessmentResultsView } from "@/components/demo/assessment-results-view";
import { Skeleton } from "@/components/ui/skeleton";

export function DemoWorkbench() {
  const { locale, t } = useMazaLocale();
  const {
    status,
    assessments,
    lastPayload,
    correlationId,
    error,
    beginRun,
    completeSuccess,
    completeError
  } = useAssessment();

  const [uploadError, setUploadError] = useState<string | null>(null);
  const apiHint = getClientApiBaseHint();
  const loading = status === "loading";

  async function run(body: AssessRiskRequestBody) {
    beginRun(body);
    try {
      const result = await assessRisk(body);
      if (!result.ok) {
        completeError(
          result.errorMessage ??
            formatApiAssessError(locale, result.status, apiHint),
          result.correlationId
        );
        return;
      }
      completeSuccess(result.assessments, result.correlationId);
    } catch (e) {
      completeError(
        e instanceof Error ? e.message : t.unknownError,
        undefined
      );
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          {t.demoTitle}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t.demoLeadBeforeFormats}{" "}
          <strong>{t.demoLeadJson}</strong>,{" "}
          <strong>{t.demoLeadCsv}</strong> {locale === "en" ? "or" : "o"}{" "}
          <strong>{t.demoLeadExcel}</strong>
          {locale === "en" ? ", or use " : ", o usa "}
          <strong>{t.demoLeadRunDemo}</strong>
          {locale === "en"
            ? ". The request is sent as "
            : ". La petición se envía como "}
          <code className="rounded bg-muted px-1">POST /assess-risk</code>{" "}
          {locale === "en"
            ? "to the Express API via proxy ("
            : "al API Express vía proxy ("}
          <code className="rounded bg-muted px-1">MAZALAB_API_BASE</code>{" "}
          {locale === "en" ? "or" : "o"}{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_API_BASE</code>
          {locale === "en" ? "; default " : "; por defecto "}
          <code className="rounded bg-muted px-1">{DEFAULT_API_BASE}</code>
          ).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.cardInput}</CardTitle>
            <CardDescription>
              <strong>{t.cardInputDescBeforeJson}</strong>{" "}
              {t.cardInputDescAfterJson}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUploadZone
              disabled={loading}
              onFile={async (file) => {
                setUploadError(null);
                try {
                  const body = await parseUploadFile(file);
                  await run(body);
                } catch (e) {
                  setUploadError(
                    e instanceof Error ? e.message : t.readFileError
                  );
                }
              }}
            />
            <Button
              className="w-full"
              variant="secondary"
              disabled={loading}
              onClick={() => run(getDemoAssessRiskPayload())}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {t.runDemo}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.cardPreview}</CardTitle>
            <CardDescription>
              {t.cardPreviewDesc}
              {loading && (
                <>
                  {" "}
                  <span className="font-medium text-muted-foreground">
                    {t.cardPreviewLoading}
                  </span>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-2" aria-busy="true">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}
            {!loading && lastPayload && (
              <>
                <pre className="max-h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
                  {JSON.stringify(lastPayload, null, 2)}
                </pre>
                {correlationId && (
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    x-correlation-id: {correlationId}
                  </p>
                )}
              </>
            )}
            {!loading && !lastPayload && (
              <p className="text-sm text-muted-foreground">
                {t.cardPreviewEmpty}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {uploadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t.invalidFile}</AlertTitle>
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}

      {status === "error" && error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t.requestError}</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            <p className="mt-2 text-xs opacity-90">
              Proxy → <code className="rounded bg-background px-1">{apiHint}</code>
            </p>
          </AlertDescription>
        </Alert>
      )}

      {status === "success" && assessments.length > 0 && (
        <AssessmentResultsView assessments={assessments} showResultsNav />
      )}
    </div>
  );
}
