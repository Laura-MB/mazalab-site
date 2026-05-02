"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileDown } from "lucide-react";
import { useAssessment } from "@/components/providers/assessment-provider";
import { useMazaLocale } from "@/components/providers/maza-locale-provider";
import { Button } from "@/components/ui/button";
import {
  openAssessmentReportPrintView,
  type ReportDetail
} from "@/lib/export/print-assessment-report";

export function ReportExportMenu() {
  const { assessments, correlationId } = useAssessment();
  const { locale, t } = useMazaLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  if (assessments.length === 0) return null;

  function exportPdf(detail: ReportDetail) {
    setOpen(false);
    openAssessmentReportPrintView(assessments, {
      correlationId: correlationId ?? undefined,
      generatedAt: new Date().toLocaleString(locale === "en" ? "en" : "es"),
      detail,
      locale
    });
  }

  return (
    <div className="relative inline-block" ref={rootRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        {t.exportMenu}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1 min-w-[14rem] rounded-md border bg-card py-1 text-sm shadow-sm"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted"
            onClick={() => exportPdf("short")}
          >
            <FileDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            {t.pdfShort}
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted"
            onClick={() => exportPdf("long")}
          >
            <FileDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
            {t.pdfLong}
          </button>
        </div>
      ) : null}
    </div>
  );
}
