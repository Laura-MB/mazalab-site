import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AssessmentProvider } from "@/components/providers/assessment-provider";
import { MazaShieldLocaleProvider } from "@/components/providers/maza-locale-provider";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <AssessmentProvider>
      <MazaShieldLocaleProvider>
        <div className="flex min-h-screen flex-col md:flex-row">
          <AppSidebar />
          <main className="min-w-0 flex-1 overflow-auto">
            <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
          </main>
        </div>
      </MazaShieldLocaleProvider>
    </AssessmentProvider>
  );
}
