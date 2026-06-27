import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { Bars, Card, KpiCard, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { getLenderPortfolioMetrics } from "@/lib/loans.functions";

export const Route = createFileRoute("/lender/risk")({
  component: RiskPage,
});

function RiskPage() {
  const metricsFn = useServerFn(getLenderPortfolioMetrics);
  const metrics = useQuery({ queryKey: ["lender", "metrics"], queryFn: () => metricsFn() });
  const m = metrics.data;
  const var95 = Math.min(25, Math.max(1, (m?.defaultProxy ?? 0) + ((m?.highClimate ?? 0) / Math.max(1, m?.submitted ?? 1)) * 10));
  const climatePd = Math.round(((m?.defaultProxy ?? 0) + (m?.highClimate ?? 0) * 0.4) * 10) / 10;
  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Governance"
        title="Risk Management"
        sub="Default prediction, concentration and climate-adjusted risk from live applications."
        right={
          <button onClick={() => metrics.refetch()} className="inline-flex items-center gap-2 rounded-xl glass-strong px-3 py-2 text-xs font-semibold hover:bg-surface-elevated">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="VaR (95%)" value={`${var95.toFixed(1)}%`} tone="gold" icon={ShieldAlert} />
        <KpiCard label="Concentration risk" value={(m?.counties?.length ?? 0) > 5 ? "Low" : "Medium"} tone={(m?.counties?.length ?? 0) > 5 ? "emerald" : "gold"} icon={ShieldAlert} sub={`${m?.counties?.length ?? 0} active counties`} />
        <KpiCard label="Climate-adjusted PD" value={`${climatePd}%`} tone="gold" icon={ShieldAlert} />
        <KpiCard label="Stress test (drought)" value={`−${Math.max(0.4, (m?.highClimate ?? 0) * 0.3).toFixed(1)}%`} tone="rose" icon={ShieldAlert} sub="ROP impact" />
      </div>
      <Card title="Default probability distribution">
        <Bars data={m?.riskDistribution ?? [0]} labels={["0-7%", "7-14%", "14-21%", "21-28%", "28-35%", "35%+"]} color="oklch(0.7 0.2 18 / 0.75)" />
      </Card>
      <Card title="Watchlist">
        <ul className="divide-y divide-border/60 text-sm">
          {(m?.watchlist ?? []).map((item) => (
            <li key={item.title} className="flex items-center justify-between gap-3 py-3">
              <a href={item.href} className="hover:text-emerald">{item.title}</a>
              <Tag label={`${item.count} cases`} tone={item.tone} />
            </li>
          ))}
          {!metrics.isLoading && (m?.watchlist ?? []).length === 0 && <li className="py-3 text-muted-foreground">No watchlist items.</li>}
        </ul>
      </Card>
    </div>
  );
}
