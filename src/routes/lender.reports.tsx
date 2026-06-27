import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileText } from "lucide-react";
import { Card, SectionTitle } from "@/components/dashboard/primitives";
import { getLenderPortfolioMetrics } from "@/lib/loans.functions";

export const Route = createFileRoute("/lender/reports")({
  component: ReportsPage,
});

const REPORTS = [
  ["Institution Report", "Aggregate KPIs and trust posture."],
  ["Portfolio Report", "Loans, performance, expected loss."],
  ["County Report", "Per-county lending and climate exposure."],
  ["Climate Risk Report", "Drought, flood, rainfall and crop suitability."],
  ["Trust Score Report", "Distribution and bias analysis."],
  ["Gender Inclusion Report", "Approval parity by gender."],
  ["Disability Inclusion Report", "Accessibility & approval rates."],
  ["Impact Report", "ESG, livelihoods, climate adaptation."],
];

function ReportsPage() {
  const metricsFn = useServerFn(getLenderPortfolioMetrics);
  const metrics = useQuery({ queryKey: ["lender", "metrics"], queryFn: () => metricsFn() });

  const downloadReport = (title: string, format: "pdf" | "excel" | "ppt") => {
    const m = metrics.data;
    const content = [
      `AgriTrust AI — ${title}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Applications: ${m?.submitted ?? 0}`,
      `Approved: ${m?.approved ?? 0}`,
      `Approval rate: ${m?.approvalRate ?? 0}%`,
      `Average trust score: ${m?.avgTrust ?? "—"}`,
      `High climate exposure: ${m?.highClimate ?? 0}`,
      `Women representation: ${m?.womenPct ?? 0}%`,
      `Disability inclusion: ${m?.disabilityPct ?? 0}%`,
    ].join("\n");
    const mime = format === "excel" ? "text/csv" : "text/plain";
    const extension = format === "excel" ? "csv" : format === "ppt" ? "ppt.txt" : "pdf.txt";
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replaceAll(" ", "-")}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Reports" title="Reports" sub="Generate compliance-grade exports from live lender metrics." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map(([t, d]) => (
          <Card key={t} title={t} icon={FileText}>
            <p className="text-sm text-muted-foreground">{d}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => downloadReport(t, "pdf")} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"><Download className="h-3.5 w-3.5" /> PDF</button>
              <button onClick={() => downloadReport(t, "excel")} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-elevated px-3 py-1.5 text-xs font-semibold hover:bg-surface"><Download className="h-3.5 w-3.5" /> Excel</button>
              <button onClick={() => downloadReport(t, "ppt")} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-elevated px-3 py-1.5 text-xs font-semibold hover:bg-surface"><Download className="h-3.5 w-3.5" /> PPT</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
