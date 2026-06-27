import { createFileRoute, Link } from "@tanstack/react-router";
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
import { APPLICANTS, COUNTY_TRUST, TRUST_HISTORY } from "@/lib/mock-data";

export const Route = createFileRoute("/lender/")({
  component: LenderOverview,
});

function LenderOverview() {
  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Portfolio overview"
        title="Agricultural Credit Intelligence"
        sub={`Explainable, climate-aware decisions across ${APPLICANTS.length}+ active applications.`}
        right={
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl glass-strong px-3.5 py-2 text-xs font-semibold hover:bg-surface-elevated">
              <Filter className="h-3.5 w-3.5" /> Filters
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl glass-strong px-3.5 py-2 text-xs font-semibold hover:bg-surface-elevated">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-glow hover:brightness-110">
              <Sparkles className="h-3.5 w-3.5" /> Ask AI
            </button>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Applications" value="1,248" sub="+12% WoW" tone="sky" icon={FileSearch} />
        <KpiCard label="Approved loans" value="892" sub="71.5% approval" tone="emerald" icon={CheckCircle2} />
        <KpiCard label="Avg trust score" value="694" sub="+8 vs last mo." tone="emerald" icon={TrendingUp} />
        <KpiCard label="Portfolio risk" value="Low–Med" sub="VaR 4.2%" tone="gold" icon={ShieldAlert} />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Default prediction" value="3.1%" sub="−0.6 pts QoQ" tone="emerald" icon={BarChart3} />
        <KpiCard label="Climate exposure" value="18%" sub="High-risk counties" tone="gold" icon={CloudRain} />
        <KpiCard label="Women financed" value="48%" sub="+6 pts YoY" tone="emerald" icon={Users} />
        <KpiCard label="Farmers w/ disabilities" value="12%" sub="Inclusive lending" tone="sky" icon={Accessibility} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card title="Approval trend (12 mo.)" icon={TrendingUp} className="lg:col-span-2">
          <Sparkline data={TRUST_HISTORY.map((v, i) => v + i * 4)} labels={["J","F","M","A","M","J","J","A","S","O","N","D"]} />
        </Card>
        <Card title="Inclusion mix" icon={Users}>
          <Donut
            segments={[
              { label: "Women", value: 48, color: "var(--emerald)" },
              { label: "Men", value: 40, color: "var(--sky)" },
              { label: "Youth", value: 22, color: "var(--gold)" },
              { label: "Disability", value: 12, color: "var(--violet)" },
            ]}
          />
        </Card>
      </section>

      <Card title="Regional trust heatmap" icon={MapIcon}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {COUNTY_TRUST.map((c) => {
            const a = 0.15 + (c.v / 100) * 0.55;
            return (
              <div
                key={c.name}
                className="rounded-xl border border-border/40 p-3"
                style={{ background: `linear-gradient(135deg, oklch(0.72 0.18 155 / ${a}), oklch(0.78 0.13 230 / ${a}))` }}
              >
                <div className="text-xs font-semibold">{c.name}</div>
                <div className="mt-1 text-lg font-bold">{c.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.risk} risk</div>
              </div>
            );
          })}
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
              {APPLICANTS.slice(0, 8).map((a) => (
                <tr key={a.id} className="hover:bg-surface-elevated/40">
                  <td className="px-3 py-3 font-medium">
                    <Link to="/lender/farmers/$id" params={{ id: a.id }} className="hover:text-emerald">
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{a.county}</td>
                  <td className="px-3 py-3 font-semibold">{a.score}</td>
                  <td className="px-3 py-3">
                    <Tag label={a.climate} tone={a.climate === "Low" ? "emerald" : a.climate === "Med" ? "gold" : "rose"} />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">KES {a.amount.toLocaleString()}</td>
                  <td className="px-3 py-3">
                    <Tag label={a.rec} tone={a.rec === "Approve" ? "emerald" : a.rec === "Decline" ? "rose" : "sky"} />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{(a.conf * 100).toFixed(0)}%</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link to="/lender/applications/$id" params={{ id: a.id }} className="grid h-7 w-7 place-items-center rounded-md bg-surface-elevated text-muted-foreground hover:text-foreground" title="Review">
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button className="grid h-7 w-7 place-items-center rounded-md bg-emerald/10 text-emerald hover:bg-emerald/20" title="Approve">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button className="grid h-7 w-7 place-items-center rounded-md bg-rose/10 text-rose hover:bg-rose/20" title="Decline">
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="AI insights" icon={Sparkles}>
        <ul className="space-y-2 text-sm">
          <li className="rounded-xl bg-surface-elevated/60 p-3">📈 Portfolio climate exposure increased <strong className="text-gold">12%</strong> this quarter — drought regions concentrated in Machakos & Garissa.</li>
          <li className="rounded-xl bg-surface-elevated/60 p-3">👩‍🌾 Women farmers in your portfolio show a <strong className="text-emerald">96% repayment rate</strong> — consider expanding outreach.</li>
          <li className="rounded-xl bg-surface-elevated/60 p-3">☕ Coffee farmers in Nyeri show the strongest Trust Scores (avg 758).</li>
          <li className="rounded-xl bg-surface-elevated/60 p-3">⚠️ Recommend manual review for 7 drought-exposed applicants &gt; KES 250,000.</li>
        </ul>
      </Card>
    </div>
  );
}
