import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Accessibility,
  BarChart3,
  CheckCircle2,
  CloudRain,
  Download,
  Eye,
  FileSearch,
  Filter,
  Layers,
  Map as MapIcon,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import {
  Card,
  Donut,
  KpiCard,
  SectionTitle,
  Sparkline,
  Tag,
} from "@/components/dashboard/primitives";
import { decideApplication, getLenderPortfolioMetrics, listAllApplications } from "@/lib/loans.functions";

export const Route = createFileRoute("/lender/")({
  component: LenderOverview,
});

function LenderOverview() {
  const qc = useQueryClient();
  const metricsFn = useServerFn(getLenderPortfolioMetrics);
  const appsFn = useServerFn(listAllApplications);
  const decideFn = useServerFn(decideApplication);
  const metrics = useQuery({ queryKey: ["lender", "metrics"], queryFn: () => metricsFn() });
  const applications = useQuery({ queryKey: ["lender", "applications"], queryFn: () => appsFn() });
  const [showFilters, setShowFilters] = useState(false);
  const [climateFilter, setClimateFilter] = useState("All");

  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" | "under_review" }) =>
      decideFn({ data: { id, decision, notes: "Quick decision from lender overview" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lender"] });
    },
  });

  const rows = useMemo(() => {
    const list = applications.data ?? [];
    return list.filter((a) => climateFilter === "All" || (a.climate_risk_snapshot ?? "").toLowerCase() === climateFilter.toLowerCase()).slice(0, 8);
  }, [applications.data, climateFilter]);

  const m = metrics.data;
  const exportCsv = () => {
    const header = ["Farmer", "County", "Trust", "Climate", "Amount", "Status", "AI Recommendation", "Confidence"];
    const body = rows.map((a) => [
      a.farmer_name,
      a.county,
      a.trust_score_snapshot ?? "",
      a.climate_risk_snapshot ?? "",
      a.amount_kes,
      a.status,
      a.ai_recommendation ?? "",
      a.ai_confidence ?? "",
    ]);
    const csv = [header, ...body].map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "agritrust-lender-overview.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Portfolio overview"
        title="Agricultural Credit Intelligence"
        sub={metrics.isLoading ? "Loading live lender data…" : `Explainable, climate-aware decisions across ${m?.submitted ?? 0} active applications.`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setShowFilters((v) => !v)} className="inline-flex items-center gap-2 rounded-xl glass-strong px-3.5 py-2 text-xs font-semibold hover:bg-surface-elevated">
              <Filter className="h-3.5 w-3.5" /> Filters
            </button>
            <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-xl glass-strong px-3.5 py-2 text-xs font-semibold hover:bg-surface-elevated">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <Link to="/lender/assistant" className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-glow hover:brightness-110">
              <Sparkles className="h-3.5 w-3.5" /> Ask AI
            </Link>
          </div>
        }
      />

      {showFilters && (
        <Card>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-muted-foreground">Climate filter</span>
            {["All", "low", "medium", "high"].map((c) => (
              <button key={c} onClick={() => setClimateFilter(c)} className={`rounded-full px-3 py-1.5 font-semibold transition ${climateFilter === c ? "bg-emerald/15 text-emerald" : "bg-surface-elevated text-muted-foreground hover:text-foreground"}`}>
                {c === "All" ? "All" : c[0].toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </Card>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Applications" value={`${m?.submitted ?? 0}`} sub={`${m?.review ?? 0} pending review`} tone="sky" icon={FileSearch} />
        <KpiCard label="Approved loans" value={`${m?.approved ?? 0}`} sub={`${m?.approvalRate ?? 0}% approval`} tone="emerald" icon={CheckCircle2} />
        <KpiCard label="Avg trust score" value={`${m?.avgTrust || "—"}`} sub={`Median ${m?.medianTrust || "—"}`} tone="emerald" icon={TrendingUp} />
        <KpiCard label="Portfolio risk" value={(m?.defaultProxy ?? 0) > 8 ? "Elevated" : (m?.defaultProxy ?? 0) > 4 ? "Medium" : "Low"} sub={`PD proxy ${m?.defaultProxy ?? 0}%`} tone="gold" icon={ShieldAlert} />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Default prediction" value={`${m?.defaultProxy ?? 0}%`} sub="Live decision proxy" tone="emerald" icon={BarChart3} />
        <KpiCard label="Climate exposure" value={`${m?.highClimate ?? 0}`} sub="High-risk applications" tone="gold" icon={CloudRain} />
        <KpiCard label="Women financed" value={`${m?.womenPct ?? 0}%`} sub="Portfolio inclusion" tone="emerald" icon={Users} />
        <KpiCard label="Farmers w/ disabilities" value={`${m?.disabilityPct ?? 0}%`} sub="Inclusive lending" tone="sky" icon={Accessibility} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card title="Approval trend (12 mo.)" icon={TrendingUp} className="lg:col-span-2">
          <Sparkline data={m?.monthlyApprovals?.length ? m.monthlyApprovals : [0]} labels={m?.monthLabels} />
        </Card>
        <Card title="Inclusion mix" icon={Users}>
          <Donut
            segments={[
              { label: "Women", value: m?.womenPct ?? 0, color: "var(--emerald)" },
              { label: "Other gender", value: Math.max(0, 100 - (m?.womenPct ?? 0)), color: "var(--sky)" },
              { label: "Youth", value: m?.youthPct ?? 0, color: "var(--gold)" },
              { label: "Disability", value: m?.disabilityPct ?? 0, color: "var(--violet)" },
            ]}
          />
        </Card>
      </section>

      <Card title="Regional trust heatmap" icon={MapIcon}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {(m?.counties ?? []).map((c) => {
            const a = 0.15 + ((c.avgScore || 500) / 850) * 0.55;
            return (
              <div
                key={c.name}
                className="rounded-xl border border-border/40 p-3 transition hover:-translate-y-0.5 hover:bg-surface-elevated"
                style={{ background: `linear-gradient(135deg, oklch(0.72 0.18 155 / ${a}), oklch(0.78 0.13 230 / ${a}))` }}
              >
                <div className="text-xs font-semibold">{c.name}</div>
                <div className="mt-1 text-lg font-bold">{c.avgScore || "—"}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.applications} apps · {c.climateRisk}% climate</div>
              </div>
            );
          })}
          {!metrics.isLoading && (m?.counties ?? []).length === 0 && <p className="col-span-full text-sm text-muted-foreground">No regional application data yet.</p>}
        </div>
      </Card>

      <Card title="Recent applications" icon={Layers}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Farmer</th>
                <th className="px-3 py-2">County</th>
                <th className="px-3 py-2">Trust</th>
                <th className="px-3 py-2">Climate</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">AI Rec</th>
                <th className="px-3 py-2">Conf.</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-surface-elevated/40">
                  <td className="px-3 py-3 font-medium">
                    <Link to="/lender/farmers/$id" params={{ id: a.farmer_id }} className="hover:text-emerald">
                      {a.farmer_name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{a.county}</td>
                  <td className="px-3 py-3 font-semibold">{a.trust_score_snapshot ?? "—"}</td>
                  <td className="px-3 py-3">
                    <Tag label={a.climate_risk_snapshot ?? "—"} tone={a.climate_risk_snapshot === "low" ? "emerald" : a.climate_risk_snapshot === "high" ? "rose" : "gold"} />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">KES {Number(a.amount_kes).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <Tag label={a.ai_recommendation ?? "—"} tone={a.ai_recommendation === "approve" ? "emerald" : a.ai_recommendation === "decline" ? "rose" : "sky"} />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{a.ai_confidence ? `${(a.ai_confidence * 100).toFixed(0)}%` : "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link to="/lender/applications/$id" params={{ id: a.id }} className="grid h-7 w-7 place-items-center rounded-md bg-surface-elevated text-muted-foreground hover:text-foreground" title="Review">
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button disabled={decide.isPending} onClick={() => decide.mutate({ id: a.id, decision: "approved" })} className="grid h-7 w-7 place-items-center rounded-md bg-emerald/10 text-emerald hover:bg-emerald/20 disabled:opacity-50" title="Approve">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button disabled={decide.isPending} onClick={() => decide.mutate({ id: a.id, decision: "rejected" })} className="grid h-7 w-7 place-items-center rounded-md bg-rose/10 text-rose hover:bg-rose/20 disabled:opacity-50" title="Decline">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!applications.isLoading && rows.length === 0 && <p className="p-4 text-sm text-muted-foreground">No applications match this filter.</p>}
        </div>
      </Card>

      <Card title="AI insights" icon={Sparkles}>
        <ul className="space-y-2 text-sm">
          <li className="rounded-xl bg-surface-elevated/60 p-3">📈 Portfolio climate exposure increased <strong className="text-gold">12%</strong> this quarter — drought regions concentrated in Machakos & Garissa.</li>
          <li className="rounded-xl bg-surface-elevated/60 p-3">👩‍🌾 Women farmers represent <strong className="text-emerald">{m?.womenPct ?? 0}%</strong> of the live portfolio — monitor approval parity.</li>
          <li className="rounded-xl bg-surface-elevated/60 p-3">☕ Current average Trust Score is <strong className="text-emerald">{m?.avgTrust || "—"}</strong> across scored applications.</li>
          <li className="rounded-xl bg-surface-elevated/60 p-3">⚠️ Recommend manual review for <strong className="text-gold">{m?.review ?? 0}</strong> pending or flagged applications.</li>
        </ul>
      </Card>
    </div>
  );
}
