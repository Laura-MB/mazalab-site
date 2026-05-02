import { FileText, BookMarked, Scale } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

const items = [
  {
    title: "Project context",
    description: "Product and technical source of truth.",
    path: "docs/PROJECT_CONTEXT.md",
    icon: BookMarked
  },
  {
    title: "Architecture decisions",
    description: "ADRs and engineering baseline.",
    path: "docs/DECISIONS.md",
    icon: FileText
  },
  {
    title: "QMS / ISO 13485 pack",
    description: "Quality manual, SVMP, SOPs, design records.",
    path: "docs/qmsr-iso13485/software-validation-master-plan.md",
    icon: Scale
  }
];

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Documentation
        </h1>
        <p className="mt-1 text-muted-foreground">
          Paths are relative to the MAZALab repository root (open in your IDE or
          Git host). Markdown preview in-app is a planned follow-up.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map(({ title, description, path, icon: Icon }) => (
          <Card key={path} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Icon className="h-4 w-4 text-primary" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <code className="break-all text-xs leading-relaxed">{path}</code>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
