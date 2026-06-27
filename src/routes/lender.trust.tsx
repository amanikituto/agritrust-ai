import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck } from "lucide-react";
import { Bars, Card, KpiCard, SectionTitle } from "@/components/dashboard/primitives";
import { getLenderPortfolioMetrics } from "@/lib/loans.functions";

export const Route = createFileRoute("/lender/trust")({
  component: TrustPage,
});

function TrustPage() {
  const metricsFn = useServerFn(getLenderPortfolioMetrics);
  const { data, isLoading } = useQuery({ queryKey: ["lender", "metrics"], queryFn: () => metricsFn() });
  const buckets = data?.scoreBuckets ?? [0];
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Risk" title="Trust Score Distribution" sub={isLoading ? "Loading live score spread…" : "Portfolio-wide live score spread."} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Avg trust" value={`${data?.avgTrust || "—"}`} tone="emerald" icon={ShieldCheck} />
        <KpiCard label="Median" value={`${data?.medianTrust || "—"}`} tone="emerald" icon={ShieldCheck} />
        <KpiCard label="Top decile" value={data?.topDecile ? `${data.topDecile}+` : "—"} tone="gold" icon={ShieldCheck} />
        <KpiCard label="At-risk (<600)" value={`${data?.atRisk ?? 0}`} tone="rose" icon={ShieldCheck} />
      </div>
      <Card title="Score buckets (500–800)">
        <Bars data={buckets} labels={["500", "550", "600", "650", "700", "750+"]} />
        <div className="mt-2 grid grid-cols-6 text-center text-[10px] text-muted-foreground">
          {["500","550","600","650","700","750+"].map(l => <div key={l}>{l}</div>)}
        </div>
      </Card>
    </div>
  );
}
