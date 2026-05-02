"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScrollText, Layers, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useMazaLocale } from "@/components/providers/maza-locale-provider";

const navPaths = [
  { href: "/demo", key: "navDemo" as const, icon: LayoutDashboard },
  { href: "/results", key: "navResults" as const, icon: Layers },
  { href: "/audit-trail", key: "navAudit" as const, icon: ScrollText }
];

export function AppSidebar() {
  const pathname = usePathname();
  const { t } = useMazaLocale();

  return (
    <aside className="flex w-full flex-col border-b bg-card md:h-screen md:w-56 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 border-b px-4 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <Shield className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{t.brandTitle}</p>
            <p className="truncate text-xs text-muted-foreground">
              {t.brandSubtitle}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto p-2 md:flex-col md:overflow-visible">
        {navPaths.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {t[key]}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden p-4 text-xs text-muted-foreground md:block">
        {t.footerTag}
      </div>
    </aside>
  );
}
