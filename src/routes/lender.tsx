import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Accessibility as AccessibilityIcon,
  BarChart3,
  Building2,
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
  Wallet,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { RequireAuth } from "@/lib/require-auth";
import { Card, DashHeader, KpiCard } from "./farmer";

export const Route = createFileRoute("/lender")({
  head: () => ({ meta: [{ title: "Lender Dashboard · AgriTrust AI" }] }),
  component: () => (
    <RequireAuth role="lender">
      <LenderDashboard />
    </RequireAuth>
  ),
});

type App = {
  name: string;
  county: string;
  score: number;
  climate: "Low" | "Med" | "High";
  gender: "F" | "M" | "NB";
  disability: boolean;
  amount: number;
  rec: "Approve" | "Review" | "Decline";
  conf: number;
  status: "Pending" | "Approved" | "In review";
};

const QUEUE: App[] = [
  { name: "Amina W.", county: "Kiambu", score: 742, climate: "Low", gender: "F", disability: false, amount: 120000, rec: "Approve", conf: 0.94, status: "Pending" },
  { name: "Joseph M.", county: "Nyeri", score: 681, climate: "Med", gender: "M", disability: false, amount: 250000, rec: "Review", conf: 0.71, status: "In review" },
  { name: "Grace O.", county: "Kisumu", score: 798, climate: "Low", gender: "F", disability: true, amount: 90000, rec: "Approve", conf: 0.97, status: "Pending" },
  { name: "Peter K.", county: "Nakuru", score: 540, climate: "High", gender: "M", disability: false, amount: 300000, rec: "Decline", conf: 0.82, status: "Pending" },
  { name: "Wanjiru N.", county: "Murang'a", score: 712, climate: "Low", gender: "F", disability: false, amount: 175000, rec: "Approve", conf: 0.89, status: "Pending" },
  { name: "Samuel T.", county: "Trans Nzoia", score: 624, climate: "Med", gender: "M", disability: true, amount: 210000, rec: "Review", conf: 0.66, status: "In review" },
];

function LenderDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const name =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "Officer";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DashHeader
        portal="Lender"
        name={name}
        onSignOut={async () => {
          await signOut();
          router.navigate({ to: "/" });
        }}
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Portfolio overview</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              Agricultural Credit Intelligence
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Explainable, climate-aware decisions across {QUEUE.length}+ active applications.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl glass-strong px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-elevated">
              <Filter className="h-4 w-4" /> Filters
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl glass-strong px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-elevated">
              <Download className="h-4 w-4" /> Export portfolio
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110">
              <Sparkles className="h-4 w-4" /> Ask AI Assistant
            </button>
          </div>
        </section>

        {/* KPI cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Applications" value="1,248" sub="+12% WoW" tone="sky" icon={FileSearch} />
          <KpiCard label="Approved loans" value="892" sub="71.5% approval" tone="emerald" icon={CheckCircle2} />
          <KpiCard label="Avg trust score" value="694" sub="+8 vs last mo." tone="emerald" icon={TrendingUp} />
          <KpiCard label="Portfolio risk" value="Low–Med" sub="VaR 4.2%" tone="gold" icon={ShieldAlert} />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Default prediction" value="3.1%" sub="−0.6 pts QoQ" tone="emerald" icon={BarChart3} />
          <KpiCard label="Climate exposure" value="18%" sub="High-risk counties" tone="gold" icon={CloudRain} />
          <KpiCard label="Women farmers" value="48%" sub="+6 pts YoY" tone="emerald" icon={Users} />
          <KpiCard label="Farmers w/ disabilities" value="12%" sub="Inclusive lending" tone="sky" icon={AccessibilityIcon} />
        </section>

        {/* Analytics row */}
        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card title="Regional lending map" icon={MapIcon} className="lg:col-span-2">
            <RegionMap />
          </Card>

          <Card title="Gender analytics" icon={Users}>
            <div className="space-y-4">
              {[
                { l: "Women approved", v: 48, c: "bg-emerald" },
                { l: "Men approved", v: 40, c: "bg-sky" },
                { l: "Youth (18–35)", v: 22, c: "bg-gold" },
                { l: "Living with disability", v: 12, c: "bg-violet" },
              ].map((row) => (
                <div key={row.l}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{row.l}</span>
                    <span className="font-semibold">{row.v}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-elevated">
                    <div className={`${row.c} h-full rounded-full`} style={{ width: `${row.v}%` }} />
                  </div>
                </div>
              ))}
              <div className="mt-3 rounded-xl bg-emerald/10 p-3 text-xs leading-relaxed text-emerald">
                <strong>Bias check OK.</strong> Approval parity across genders within ±3 pts of
                expected baseline.
              </div>
            </div>
          </Card>
        </section>

        {/* Loan queue */}
        <section className="mt-8">
          <Card title="Application queue" icon={Layers}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">Applicant</th>
                    <th className="px-3 py-2 font-semibold">County</th>
                    <th className="px-3 py-2 font-semibold">Trust</th>
                    <th className="px-3 py-2 font-semibold">Climate</th>
                    <th className="px-3 py-2 font-semibold">Gender</th>
                    <th className="px-3 py-2 font-semibold">A11y</th>
                    <th className="px-3 py-2 font-semibold">Amount</th>
                    <th className="px-3 py-2 font-semibold">AI Rec</th>
                    <th className="px-3 py-2 font-semibold">Conf.</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {QUEUE.map((a) => (
                    <tr key={a.name} className="hover:bg-surface-elevated/40">
                      <td className="px-3 py-3 font-medium">{a.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">{a.county}</td>
                      <td className="px-3 py-3 font-semibold">{a.score}</td>
                      <td className="px-3 py-3">
                        <Tag
                          label={a.climate}
                          tone={
                            a.climate === "Low" ? "emerald" : a.climate === "Med" ? "gold" : "rose"
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{a.gender}</td>
                      <td className="px-3 py-3">
                        {a.disability ? (
                          <AccessibilityIcon className="h-4 w-4 text-violet" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs">
                        KES {a.amount.toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <Tag
                          label={a.rec}
                          tone={
                            a.rec === "Approve" ? "emerald" : a.rec === "Review" ? "sky" : "rose"
                          }
                        />
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {(a.conf * 100).toFixed(0)}%
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            className="grid h-7 w-7 place-items-center rounded-md bg-surface-elevated text-muted-foreground hover:text-foreground"
                            title="View explanation"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="grid h-7 w-7 place-items-center rounded-md bg-emerald/10 text-emerald hover:bg-emerald/20"
                            title="Approve"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="grid h-7 w-7 place-items-center rounded-md bg-rose/10 text-rose hover:bg-rose/20"
                            title="Decline"
                          >
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
        </section>

        {/* Bias / Explainability */}
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <Card title="Bias monitoring" icon={ShieldAlert}>
            <ul className="space-y-3 text-sm">
              {[
                { l: "Gender approval gap", v: "2.1 pts", ok: true },
                { l: "Disability approval gap", v: "1.4 pts", ok: true },
                { l: "Youth approval gap", v: "5.8 pts", ok: false },
                { l: "Regional disparity (County)", v: "3.2 pts", ok: true },
              ].map((r) => (
                <li
                  key={r.l}
                  className="flex items-center justify-between rounded-xl bg-surface-elevated/60 p-3"
                >
                  <span>{r.l}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                      r.ok ? "bg-emerald/10 text-emerald" : "bg-gold/10 text-gold"
                    }`}
                  >
                    {r.v} {r.ok ? "OK" : "Review"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Sample decision · Amina W." icon={Sparkles}>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recommendation</span>
                <Tag label="Approve · 94% confidence" tone="emerald" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald">
                  Top positive factors
                </div>
                <ul className="mt-1.5 space-y-1 text-sm">
                  <li>• 24 months consistent M-Pesa savings (+0.22)</li>
                  <li>• Cooperative tenure 5 yrs, strong graph centrality (+0.18)</li>
                  <li>• Climate score Low — Kiambu rainfall stable (+0.11)</li>
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Considerations
                </div>
                <ul className="mt-1.5 space-y-1 text-sm">
                  <li>• Limited formal financial records (−0.06)</li>
                  <li>• No crop insurance on file (−0.04)</li>
                </ul>
              </div>
              <div className="rounded-xl bg-surface-elevated/60 p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Bias check:</strong> Decision robust to gender,
                age, and region swaps. Model v1.4 · Human review recommended for amounts &gt; KES
                500,000.
              </div>
            </div>
          </Card>
        </section>

        {/* Quick actions */}
        <section className="mt-8">
          <Card title="Quick actions" icon={Wallet}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { i: FileSearch, l: "Review applications" },
                { i: BarChart3, l: "Generate reports" },
                { i: Building2, l: "Explore graph" },
                { i: Users, l: "Search farmers" },
              ].map((a) => (
                <button
                  key={a.l}
                  className="flex items-center gap-3 rounded-xl bg-surface-elevated/60 p-4 text-left text-sm font-medium transition hover:bg-surface-elevated"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-emerald">
                    <a.i className="h-4 w-4" />
                  </span>
                  {a.l}
                </button>
              ))}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}

function Tag({
  label,
  tone,
}: {
  label: string;
  tone: "emerald" | "sky" | "gold" | "rose" | "violet";
}) {
  const map = {
    emerald: "bg-emerald/10 text-emerald",
    sky: "bg-sky/10 text-sky",
    gold: "bg-gold/10 text-gold",
    rose: "bg-rose/10 text-rose",
    violet: "bg-violet/10 text-violet",
  }[tone];
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${map}`}>
      {label}
    </span>
  );
}

function RegionMap() {
  // Stylised, non-geographic county heatmap
  const counties = [
    { n: "Kiambu", v: 92 },
    { n: "Nyeri", v: 78 },
    { n: "Murang'a", v: 71 },
    { n: "Nakuru", v: 64 },
    { n: "Kisumu", v: 81 },
    { n: "Trans Nzoia", v: 58 },
    { n: "Meru", v: 74 },
    { n: "Kakamega", v: 69 },
    { n: "Machakos", v: 55 },
    { n: "Bungoma", v: 62 },
    { n: "Uasin Gishu", v: 70 },
    { n: "Embu", v: 66 },
  ];
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {counties.map((c) => {
          const a = 0.15 + (c.v / 100) * 0.55;
          return (
            <div
              key={c.n}
              className="rounded-xl border border-border/40 p-3"
              style={{
                background: `linear-gradient(135deg, oklch(0.72 0.18 155 / ${a}), oklch(0.78 0.13 230 / ${a}))`,
              }}
            >
              <div className="text-xs font-semibold">{c.n}</div>
              <div className="mt-1 text-lg font-bold tracking-tight">{c.v}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                trust idx
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Lower exposure</span>
        <span>Higher trust</span>
      </div>
    </div>
  );
}
