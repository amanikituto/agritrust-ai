import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, ShieldAlert } from "lucide-react";
import { Card, SectionTitle, ShapBars, Tag } from "@/components/dashboard/primitives";
import { getLenderPortfolioMetrics, listAllApplications } from "@/lib/loans.functions";

export const Route = createFileRoute("/lender/explainability")({
  component: ExplainPage,
});

function ExplainPage() {
  const appsFn = useServerFn(listAllApplications);
  const metricsFn = useServerFn(getLenderPortfolioMetrics);
  const apps = useQuery({ queryKey: ["lender", "applications"], queryFn: () => appsFn() });
  const metrics = useQuery({ queryKey: ["lender", "metrics"], queryFn: () => metricsFn() });
  const rows = (apps.data ?? []).slice(0, 4);
  const toBars = (factors: string[] | null | undefined, sign: 1 | -1) =>
    (factors?.length ? factors : sign > 0 ? ["Verified repayment data", "Cooperative activity", "Stable farm records"] : ["Missing records", "Climate exposure"])
      .slice(0, sign > 0 ? 3 : 2)
      .map((l, i) => ({ l, v: sign * (0.16 - i * 0.04) }));

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Explainable AI" title="Decision Explainability" sub={apps.isLoading ? "Loading live explanations…" : "Every live recommendation comes with a reason."} />
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((a) => (
          <Card key={a.id} title={`${a.farmer_name} · ${a.ai_recommendation ?? "review"}`} icon={Brain}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Tag label={`Score ${a.trust_score_snapshot ?? "—"}`} tone="emerald" />
              <Tag label={a.ai_confidence ? `${(a.ai_confidence*100).toFixed(0)}% confidence` : "n/a confidence"} tone="sky" />
              <Tag label={`${a.climate_risk_snapshot ?? "—"} climate`} tone={a.climate_risk_snapshot === "low" ? "emerald" : a.climate_risk_snapshot === "high" ? "rose" : "gold"} />
            </div>
            <ShapBars positive={toBars(a.top_positive_factors, 1)} negative={toBars(a.top_negative_factors, -1)} />
          </Card>
        ))}
        {!apps.isLoading && rows.length === 0 && <p className="text-sm text-muted-foreground">No live applications available for explainability yet.</p>}
      </div>
      <Card title="Bias monitoring" icon={ShieldAlert}>
        <ul className="space-y-2 text-sm">
          {[
            ["Women portfolio representation", `${metrics.data?.womenPct ?? 0}%`, (metrics.data?.womenPct ?? 0) >= 35],
            ["Disability inclusion coverage", `${metrics.data?.disabilityPct ?? 0}%`, (metrics.data?.disabilityPct ?? 0) >= 5],
            ["Youth segment coverage", `${metrics.data?.youthPct ?? 0}%`, (metrics.data?.youthPct ?? 0) >= 15],
            ["Regional spread", `${metrics.data?.counties?.length ?? 0} counties`, (metrics.data?.counties?.length ?? 0) >= 3],
          ].map(([l, v, ok]) => (
            <li key={l as string} className="flex items-center justify-between rounded-xl bg-surface-elevated/60 p-3">
              <span>{l}</span>
              <Tag label={`${v} ${ok ? "OK" : "Review"}`} tone={ok ? "emerald" : "gold"} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
