import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { Card, SectionTitle } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/farmer/reports")({
  component: ReportsPage,
});

const REPORTS = [
  ["Trust Report", "Your full trust profile with SHAP explanation."],
  ["Credit Readiness Report", "Checklist progress and improvement roadmap."],
  ["Climate Report", "Weather, NDVI, and risk for your farm."],
  ["Farm Performance Report", "Production, income and savings analytics."],
  ["Loan History Report", "All past and current loan applications."],
];

function ReportsPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Reports" title="Reports & Documents" sub="Download as PDF or Excel." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map(([t, d]) => (
          <Card key={t} title={t} icon={FileText}>
            <p className="text-sm text-muted-foreground">{d}</p>
            <div className="mt-4 flex gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110">
                <Download className="h-3.5 w-3.5" /> PDF
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg bg-surface-elevated px-3 py-1.5 text-xs font-semibold hover:bg-surface">
                <Download className="h-3.5 w-3.5" /> Excel
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
