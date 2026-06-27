import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarCheck,
  CloudRain,
  Cpu,
  Droplets,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Leaf,
  LineChart as LineChartIcon,
  LogOut,
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
import { RequireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/farmer")({
  head: () => ({ meta: [{ title: "Farmer Dashboard · AgriTrust AI" }] }),
  component: () => (
    <RequireAuth role="farmer">
      <FarmerDashboard />
    </RequireAuth>
  ),
});

function FarmerDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const name =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "Farmer";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DashHeader
        portal="Farmer"
        name={name}
        onSignOut={async () => {
          await signOut();
          router.navigate({ to: "/" });
        }}
      />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome */}
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Good morning</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              Karibu, {name} 🌱
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your farm is becoming more credit-ready.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110">
              <PlusCircle className="h-4 w-4" /> Apply for loan
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl glass-strong px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-elevated">
              <Mic className="h-4 w-4" /> Ask AI Assistant
            </button>
          </div>
        </section>

        {/* KPI cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreCard score={742} trend="+18 this month" />
          <KpiCard
            label="Credit readiness"
            value="78%"
            tone="emerald"
            icon={Shield}
            sub="2 items left"
          />
          <KpiCard
            label="Loan eligibility"
            value="KES 120,000"
            tone="sky"
            icon={Wallet}
            sub="Pre-qualified"
          />
          <KpiCard
            label="Climate risk"
            value="Low"
            tone="gold"
            icon={CloudRain}
            sub="Rainfall on track"
          />
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Savings growth" value="+22%" tone="emerald" icon={PiggyBank} sub="Last 90 days" />
          <KpiCard label="Farm health" value="Healthy" tone="sky" icon={Sprout} sub="NDVI 0.71" />
          <KpiCard label="Coop ranking" value="#12 / 240" tone="gold" icon={Users} sub="Kiambu coop" />
          <KpiCard label="Monthly income" value="KES 38,400" tone="emerald" icon={TrendingUp} sub="+8% MoM" />
        </section>

        {/* Charts */}
        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card title="Trust score history" icon={LineChartIcon} className="lg:col-span-2">
            <Sparkline
              data={[612, 624, 631, 640, 655, 662, 678, 689, 701, 712, 728, 742]}
              labels={["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]}
            />
          </Card>
          <Card title="Rainfall trend" icon={Droplets}>
            <Bars data={[40, 65, 80, 55, 38, 28, 22, 30, 48, 70, 88, 75]} />
          </Card>
        </section>

        {/* Checklist + recs */}
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
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
                <li key={label} className="flex items-center justify-between py-3">
                  <span className="text-sm">{label}</span>
                  <StatusPill status={status as Status} />
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
                <li
                  key={r.t}
                  className="flex items-center justify-between rounded-xl bg-surface-elevated/60 p-3"
                >
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

        {/* Quick actions + notifications */}
        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          <Card title="Quick actions" icon={Activity} className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { i: PlusCircle, l: "Apply for loan" },
                { i: Upload, l: "Upload records" },
                { i: Sprout, l: "Record harvest" },
                { i: Landmark, l: "Mobile money" },
                { i: CloudRain, l: "View weather" },
                { i: Users, l: "Request officer" },
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

          <Card title="Notifications" icon={Bell}>
            <ul className="space-y-3">
              {[
                { t: "Heavy rainfall expected Thursday", k: "Climate", c: "text-sky" },
                { t: "Your loan application is under review", k: "Loan", c: "text-emerald" },
                { t: "Repayment due in 5 days — KES 4,200", k: "Reminder", c: "text-gold" },
                { t: "New training: Climate-smart maize", k: "Training", c: "text-emerald" },
              ].map((n) => (
                <li
                  key={n.t}
                  className="flex items-start gap-3 rounded-xl bg-surface-elevated/60 p-3"
                >
                  <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.c.replace("text-", "bg-")}`} />
                  <div>
                    <div className="text-sm">{n.t}</div>
                    <div className={`mt-0.5 text-[10px] uppercase tracking-wider ${n.c}`}>{n.k}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </main>
    </div>
  );
}

/* ---------------- shared dashboard primitives ---------------- */

type Status = "done" | "progress" | "attention";

export function DashHeader({
  portal,
  name,
  onSignOut,
}: {
  portal: string;
  name: string;
  onSignOut: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald to-forest shadow-glow">
            <Leaf className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight">AgriTrust AI</span>
          <span className="ml-3 rounded-full bg-surface-elevated px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {portal}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">{name}</span>
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface-elevated px-3 py-2 text-xs font-semibold hover:bg-surface"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

export function Card({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl glass p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {Icon && <Icon className="h-4 w-4 text-emerald" />}
          {title}
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "sky" | "gold";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const toneClass = { emerald: "text-emerald", sky: "text-sky", gold: "text-gold" }[tone];
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg bg-surface-elevated ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function ScoreCard({ score, trend }: { score: number; trend: string }) {
  const pct = score / 850;
  const r = 32;
  const c = 2 * Math.PI * r;
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Trust score
        </span>
        <span className="rounded-full bg-emerald/10 px-2 py-0.5 text-[10px] font-semibold text-emerald">
          {trend}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="6" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="oklch(0.72 0.18 155)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
          />
        </svg>
        <div>
          <div className="text-3xl font-bold tracking-tight">{score}</div>
          <div className="text-xs text-muted-foreground">/ 850 · Good</div>
        </div>
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: Status }) {
  const map = {
    done: { l: "Complete", c: "bg-emerald/10 text-emerald" },
    progress: { l: "In progress", c: "bg-sky/10 text-sky" },
    attention: { l: "Needs attention", c: "bg-gold/10 text-gold" },
  }[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${map.c}`}>
      {map.l}
    </span>
  );
}

function Sparkline({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 600;
  const h = 160;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / (max - min || 1)) * (h - 20) - 10}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full">
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.18 155 / 0.4)" />
          <stop offset="100%" stopColor="oklch(0.72 0.18 155 / 0)" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${points} ${w},${h}`} fill="url(#spark)" stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke="oklch(0.72 0.18 155)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {labels.map((l, i) => (
        <text
          key={i}
          x={i * step}
          y={h + 16}
          textAnchor="middle"
          fontSize="10"
          fill="currentColor"
          className="text-muted-foreground"
        >
          {l}
        </text>
      ))}
    </svg>
  );
}

function Bars({ data }: { data: number[] }) {
  const w = 300;
  const h = 160;
  const max = Math.max(...data);
  const bw = (w - 10) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {data.map((v, i) => {
        const bh = (v / max) * (h - 20);
        return (
          <rect
            key={i}
            x={i * bw + 4}
            y={h - bh}
            width={bw - 6}
            height={bh}
            rx="3"
            fill="oklch(0.78 0.13 230 / 0.85)"
          />
        );
      })}
    </svg>
  );
}
