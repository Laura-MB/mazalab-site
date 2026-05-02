"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  type MazaLocale,
  getMazaStrings,
  type MazaStrings
} from "@/lib/i18n/maza-shield-strings";

const STORAGE_KEY = "maza-shield-locale";

type Ctx = {
  locale: MazaLocale;
  setLocale: (locale: MazaLocale) => void;
  t: MazaStrings;
};

const MazaLocaleContext = createContext<Ctx | null>(null);

export function MazaShieldLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<MazaLocale>("es");

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "en" || v === "es") setLocaleState(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "es";
  }, [locale]);

  const setLocale = useCallback((next: MazaLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useMemo(() => getMazaStrings(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <MazaLocaleContext.Provider value={value}>
      {children}
    </MazaLocaleContext.Provider>
  );
}

export function useMazaLocale(): Ctx {
  const ctx = useContext(MazaLocaleContext);
  if (!ctx) {
    throw new Error("useMazaLocale must be used within MazaShieldLocaleProvider");
  }
  return ctx;
}
