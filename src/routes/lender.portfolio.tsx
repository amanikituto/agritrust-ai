import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, CheckCircle2, Download, Layers, RefreshCw, TrendingUp } from "lucide-react";
import { Bars, Card, Donut, KpiCard, SectionTitle, Sparkline } from "@/components/dashboard/primitives";
import { getLenderPortfolioMetrics } from "@/lib/loans.functions";

export const Route = createFileRoute("/lender/portfolio")({
  component: PortfolioPage,
});

function PortfolioPage() {
  const [range, setRange] = useState<"6m" | "12m">("12m");
  const metricsFn = useServerFn(getLenderPortfolioMetrics);
  const metrics = useQuery({ queryKey: ["lender", "metrics"], queryFn: () => metricsFn() });
  const m = metrics.data;
  const slice = range === "6m" ? -6 : -12;
  const labels = m?.monthLabels?.slice(slice) ?? [];
  const monthlyValue = m?.monthlyValue?.slice(slice) ?? [0];
  const monthlyCounts = m?.monthlyCounts?.slice(slice) ?? [0];
  const expectedLoss = monthlyCounts.map((v, i) => Math.round((v * ((m?.defaultProxy ?? 0) + i + 1)) / 10));
  const valueLabel = m?.portfolioValue ? `KES ${(m.portfolioValue / 1_000_000).toFixed(1)}M` : "KES 0";

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(m ?? {}, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "agritrust-portfolio-metrics.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Performance"
        title="Portfolio Analytics"
        sub={metrics.isLoading ? "Loading live Supabase portfolio metrics…" : "Institution-wide KPIs and trends from live applications."}
        right={
          <div className="flex flex-wrap items-center gap-2">
            {["6m", "12m"].map((r) => (
              <button key={r} onClick={() => setRange(r as "6m" | "12m")} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${range === r ? "bg-emerald/15 text-emerald" : "glass-strong text-muted-foreground hover:text-foreground"}`}>
                {r.toUpperCase()}
              </button>
            ))}
            <button onClick={() => metrics.refetch()} className="inline-flex items-center gap-2 rounded-xl glass-strong px-3 py-2 text-xs font-semibold hover:bg-surface-elevated">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <button onClick={exportJson} className="inline-flex items-center gap-2 rounded-xl glass-strong px-3 py-2 text-xs font-semibold hover:bg-surface-elevated">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Portfolio value" value={valueLabel} tone="emerald" icon={Layers} sub={`${m?.approved ?? 0} approved loans`} />
        <KpiCard label="Approval rate" value={`${m?.approvalRate ?? 0}%`} tone="emerald" icon={CheckCircle2} sub={`${m?.submitted ?? 0} total applications`} />
        <KpiCard label="Default rate" value={`${m?.defaultProxy ?? 0}%`} tone="gold" icon={BarChart3} sub="Live proxy from decisions" />
        <KpiCard label="ROP" value={`${Math.max(0, 12 - (m?.defaultProxy ?? 0)).toFixed(1)}%`} tone="emerald" icon={TrendingUp} sub="Return on portfolio proxy" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={`Portfolio growth (${range})`} className="lg:col-span-2">
          <Sparkline data={monthlyValue} labels={labels} />
        </Card>
        <Card title="Crop mix">
          <Donut segments={m?.cropMix ?? [{ label: "Loading", value: 1, color: "var(--emerald)" }]} />
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Disbursements / month (KES M)">
          <Bars data={monthlyValue} labels={labels} color="oklch(0.72 0.18 155 / 0.85)" />
        </Card>
        <Card title="Expected loss (basis points)">
          <Bars data={expectedLoss} labels={labels} color="oklch(0.7 0.2 18 / 0.7)" />
        </Card>
      </div>
    </div>
  );
}
