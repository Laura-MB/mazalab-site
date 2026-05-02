import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getMazalabApiBase } from "@/lib/config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuditTrailPage() {
  const base = getMazalabApiBase();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Audit Trail
        </h1>
        <p className="mt-1 text-muted-foreground">
          Acceso de solo lectura al API de auditoría append-only del Mother Brain.
          Base resuelta con{" "}
          <code className="rounded bg-muted px-1 text-xs">MAZALAB_API_BASE</code> o{" "}
          <code className="rounded bg-muted px-1 text-xs">NEXT_PUBLIC_API_BASE</code>{" "}
          (<span className="font-mono text-xs">{base}</span>).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Audit log</CardTitle>
            <CardDescription>
              <code className="text-xs">GET /audit-log</code> — paginado y filtros.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={`${base}/audit-log?limit=20`} target="_blank" rel="noreferrer">
                Abrir JSON <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audit stats</CardTitle>
            <CardDescription>
              <code className="text-xs">GET /audit-log/stats</code> — agregados y
              tendencias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild>
              <Link href={`${base}/audit-log/stats`} target="_blank" rel="noreferrer">
                Abrir JSON <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap</CardTitle>
          <CardDescription>
            Añadir route handlers proxy <code className="text-xs">/api/audit-log/*</code>{" "}
            para incrustar tablas sin CORS, igual que{" "}
            <code className="text-xs">/api/assess-risk</code>.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
