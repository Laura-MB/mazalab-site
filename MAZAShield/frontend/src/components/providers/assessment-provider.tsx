"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { AssessRiskRequestBody, RiskAssessment } from "@/lib/api/types";

export type AssessmentRunStatus = "idle" | "loading" | "success" | "error";

type AssessmentContextValue = {
  status: AssessmentRunStatus;
  assessments: RiskAssessment[];
  lastPayload: AssessRiskRequestBody | null;
  correlationId?: string;
  error: string | null;
  lastRunAt: string | null;
  /** Called when a run starts (demo page). */
  beginRun: (payload: AssessRiskRequestBody) => void;
  /** Called when POST /assess-risk succeeds. */
  completeSuccess: (
    assessments: RiskAssessment[],
    correlationId: string | undefined
  ) => void;
  completeError: (message: string, correlationId?: string) => void;
  reset: () => void;
};

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AssessmentRunStatus>("idle");
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [lastPayload, setLastPayload] = useState<AssessRiskRequestBody | null>(
    null
  );
  const [correlationId, setCorrelationId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);

  const beginRun = useCallback((payload: AssessRiskRequestBody) => {
    setLastPayload(payload);
    setStatus("loading");
    setError(null);
  }, []);

  const completeSuccess = useCallback(
    (next: RiskAssessment[], cid: string | undefined) => {
      setAssessments(next);
      setCorrelationId(cid);
      setStatus("success");
      setError(null);
      setLastRunAt(new Date().toISOString());
    },
    []
  );

  const completeError = useCallback((message: string, cid?: string) => {
    setAssessments([]);
    setCorrelationId(cid);
    setStatus("error");
    setError(message);
    setLastRunAt(new Date().toISOString());
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setAssessments([]);
    setLastPayload(null);
    setCorrelationId(undefined);
    setError(null);
    setLastRunAt(null);
  }, []);

  const value = useMemo(
    () => ({
      status,
      assessments,
      lastPayload,
      correlationId,
      error,
      lastRunAt,
      beginRun,
      completeSuccess,
      completeError,
      reset
    }),
    [
      status,
      assessments,
      lastPayload,
      correlationId,
      error,
      lastRunAt,
      beginRun,
      completeSuccess,
      completeError,
      reset
    ]
  );

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const ctx = useContext(AssessmentContext);
  if (!ctx) {
    throw new Error("useAssessment must be used within AssessmentProvider");
  }
  return ctx;
}
