"use client";

import { useCallback, useState } from "react";
import { Upload, FileJson, Table } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMazaLocale } from "@/components/providers/maza-locale-provider";

type Props = {
  onFile: (file: File) => void;
  disabled?: boolean;
  className?: string;
};

export function FileUploadZone({ onFile, disabled, className }: Props) {
  const { t } = useMazaLocale();
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      if (disabled) return;
      const f = e.dataTransfer.files[0];
      if (f) onFile(f);
    },
    [disabled, onFile]
  );

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{t.uploadLabel}</Label>
      <div
        role="button"
        tabIndex={0}
        onDragEnter={() => setDrag(true)}
        onDragLeave={() => setDrag(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors",
          drag ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
        <p className="text-center text-sm text-muted-foreground">
          {t.uploadDrop}
        </p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          <FileJson className="inline h-3 w-3" /> .json ·{" "}
          <Table className="inline h-3 w-3" /> .csv · .xlsx
        </p>
        <Button variant="secondary" className="mt-4" asChild disabled={disabled}>
          <label>
            <input
              type="file"
              accept=".json,.csv,.xlsx,.xls,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              disabled={disabled}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
                e.target.value = "";
              }}
            />
            {t.browseFiles}
          </label>
        </Button>
      </div>
    </div>
  );
}
