"use client";

import { useMazaLocale } from "@/components/providers/maza-locale-provider";
import type { MazaLocale } from "@/lib/i18n/maza-shield-strings";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { locale, setLocale } = useMazaLocale();

  function pill(active: boolean) {
    return cn(
      "rounded px-2 py-1 text-xs font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground"
    );
  }

  function select(next: MazaLocale) {
    setLocale(next);
  }

  return (
    <div
      className="flex shrink-0 items-center rounded-md border bg-background p-0.5"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        className={pill(locale === "es")}
        onClick={() => select("es")}
        aria-pressed={locale === "es"}
      >
        ES
      </button>
      <button
        type="button"
        className={pill(locale === "en")}
        onClick={() => select("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
