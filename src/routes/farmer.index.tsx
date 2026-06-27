import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  CalendarCheck,
  CloudRain,
  Cpu,
  Droplets,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Leaf,
  LineChart as LineIcon,
  Mic,
  PiggyBank,
  PlusCircle,
  Shield,
  Sprout,
  TrendingUp,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyTrustScore } from "@/lib/farmer-data.functions";
import {
  Bars,
  Card,
  Gauge,
  KpiCard,
  SectionTitle,
  Sparkline,
  StatusPill,
} from "@/components/dashboard/primitives";
import { NOTIFICATIONS, RAINFALL, TRUST_HISTORY } from "@/lib/mock-data";

export const Route = createFileRoute("/farmer/")({
  component: FarmerOverview,
});

function FarmerOverview() {
  const { user } = useAuth();
  const tsFn = useServerFn(getMyTrustScore);
  const ts = useQuery({ queryKey: ["trust", "mine"], queryFn: () => tsFn() });
  const name =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "Farmer";

  const score = ts.data?.score ?? 0;
  const readiness = ts.data?.credit_readiness ?? 0;
  const eligibility = ts.data?.loan_eligibility_kes ?? 0;
  const climate = ts.data?.climate_risk ?? "—";

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Good morning"
        title={`Karibu, ${name} 🌱`}
        sub="Your farm is becoming more credit-ready."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/farmer/loans" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110">
              <PlusCircle className="h-4 w-4" /> Apply for loan
            </Link>
            <Link to="/farmer/assistant" className="inline-flex items-center gap-2 rounded-xl glass-strong px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-elevated">
              <Mic className="h-4 w-4" /> Ask AI
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card title="Trust Score" icon={Shield}>
          <div className="flex flex-col items-center py-2">
            <Gauge score={score} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
              <Link to="/farmer/trust-score" className="rounded-full bg-emerald/10 px-2.5 py-1 font-semibold text-emerald hover:bg-emerald/20">
                {ts.data ? "View breakdown" : "Compute now"}
              </Link>
              <span className="rounded-full bg-surface-elevated px-2.5 py-1 text-muted-foreground">Climate · {climate}</span>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard label="Credit readiness" value={`${readiness}%`} tone="emerald" icon={Shield} sub="Live" />
          <KpiCard label="Loan eligibility" value={`KES ${eligibility.toLocaleString()}`} tone="sky" icon={Wallet} sub="Pre-qualified" />
          <KpiCard label="Climate risk" value={climate} tone="gold" icon={CloudRain} sub="From engine" />
          <KpiCard label="Productivity" value="Healthy" tone="emerald" icon={Sprout} sub="NDVI 0.71" />
          <KpiCard label="Savings 90d" value="+22%" tone="emerald" icon={PiggyBank} sub="vs prev period" />
          <KpiCard label="Coop rank" value="#12 / 240" tone="gold" icon={Users} sub="Kiambu coop" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card title="Trust score history" icon={LineIcon} className="lg:col-span-2">
          <Sparkline data={TRUST_HISTORY} labels={["J","F","M","A","M","J","J","A","S","O","N","D"]} />
        </Card>
        <Card title="Rainfall trend" icon={Droplets}>
          <Bars data={RAINFALL} />
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Credit readiness checklist" icon={CalendarCheck}>
          <ul className="divide-y divide-border/60">
            {[
              ["Verified identity", "done"],
              ["Farm verified", "done"],
              ["Production records", "progress"],
              ["Repayment history", "done"],
              ["Savings consistency", "progress"],
              ["Insurance", "attention"],
              ["Cooperative membership", "done"],
              ["Financial records", "progress"],
            ].map(([label, status]) => (
              <li key={label as string} className="flex items-center justify-between py-3">
                <span className="text-sm">{label}</span>
                <StatusPill status={status as "done" | "progress" | "attention"} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="AI recommendations" icon={Cpu}>
          <ul className="space-y-3">
            {[
              { icon: PiggyBank, t: "Increase weekly savings by KES 300", k: "+12 score" },
              { icon: Droplets, t: "Join the Mwea irrigation scheme", k: "Climate +" },
              { icon: Leaf, t: "Plant drought-resistant maize (DK8031)", k: "Risk −18%" },
              { icon: GraduationCap, t: "Attend cooperative finance training", k: "Trust +" },
              { icon: HeartHandshake, t: "Purchase crop insurance (KCB Bima)", k: "Eligibility +" },
            ].map((r) => (
              <li key={r.t} className="flex items-center justify-between rounded-xl bg-surface-elevated/60 p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-emerald">
                    <r.icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm">{r.t}</span>
                </div>
                <span className="rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald">
                  {r.k}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card title="Quick actions" icon={Activity} className="lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            {([
              { i: PlusCircle, l: "Apply for loan", to: "/farmer/loans" },
              { i: Upload, l: "Upload records", to: "/farmer/farm" },
              { i: Sprout, l: "Record harvest", to: "/farmer/farm" },
              { i: Landmark, l: "Marketplace", to: "/farmer/marketplace" },
              { i: CloudRain, l: "View weather", to: "/farmer/climate" },
              { i: Users, l: "Network", to: "/farmer/network" },
            ] as const).map((a) => (
              <Link key={a.l} to={a.to} className="flex items-center gap-3 rounded-xl bg-surface-elevated/60 p-4 text-left text-sm font-medium transition hover:bg-surface-elevated">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-emerald">
                  <a.i className="h-4 w-4" />
                </span>
                {a.l}
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Notifications" icon={Bell}>
          <ul className="space-y-3">
            {NOTIFICATIONS.slice(0, 4).map((n) => (
              <li key={n.id} className="flex items-start gap-3 rounded-xl bg-surface-elevated/60 p-3">
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald" />
                <div className="min-w-0">
                  <div className="text-sm">{n.t}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {n.k} · {n.time}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        AgriTrust AI — <TrendingUp className="inline h-3 w-3" /> Making invisible farmers visible.
      </p>
    </div>
  );
}
