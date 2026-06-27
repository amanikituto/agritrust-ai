import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CloudRain,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bars,
  Card,
  Gauge,
  KpiCard,
  NetworkGraph,
  SectionTitle,
  ShapBars,
  Sparkline,
  Tag,
} from "@/components/dashboard/primitives";
import { findApplicant, RAINFALL, SHAP_FACTORS, TRUST_HISTORY } from "@/lib/mock-data";

export const Route = createFileRoute("/lender/farmers/$id")({
  loader: ({ params }) => {
    const farmer = findApplicant(params.id);
    if (!farmer) throw notFound();
    return { farmer };
  },
  component: FarmerProfile,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Farmer not found.</div>
  ),
});

function FarmerProfile() {
  const { farmer } = Route.useLoaderData();
  return (
    <div className="space-y-8">
      <Link to="/lender/farmers" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to directory
      </Link>

      <SectionTitle
        eyebrow={farmer.cooperative}
        title={farmer.name}
        sub={`${farmer.crop} farmer · ${farmer.county} · ${farmer.farmSizeAcres} acres`}
        right={
          <Link to="/lender/applications/$id" params={{ id: farmer.id }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110">
            <Wallet className="h-4 w-4" /> Open decision
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card title="Trust Score" icon={ShieldCheck}>
          <div className="flex flex-col items-center py-2">
            <Gauge score={farmer.score} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Tag label={`${(farmer.conf * 100).toFixed(0)}% confidence`} tone="emerald" />
              <Tag label={`${farmer.climate} climate`} tone={farmer.climate === "Low" ? "emerald" : farmer.climate === "Med" ? "gold" : "rose"} />
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard label="Loans repaid" value={String(farmer.loansRepaid)} tone="emerald" icon={BadgeCheck} />
          <KpiCard label="Active loans" value={String(farmer.loansActive)} tone="sky" icon={Wallet} />
          <KpiCard label="Savings" value={`KES ${farmer.savingsKES.toLocaleString()}`} tone="emerald" icon={TrendingUp} />
          <KpiCard label="Mobile money 90d" value={`KES ${farmer.mobileMoney90d.toLocaleString()}`} tone="sky" icon={Wallet} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Contact" icon={Users}>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {farmer.phone}</li>
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {farmer.name.toLowerCase().replace(/\s+/g, ".")}@agritrust.app</li>
            <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {farmer.county}, Kenya</li>
            <li className="flex items-center gap-2"><Sprout className="h-3.5 w-3.5 text-muted-foreground" /> {farmer.crop} · {farmer.farmSizeAcres} ac</li>
          </ul>
        </Card>
        <Card title="Trust trend" icon={TrendingUp} className="lg:col-span-2">
          <Sparkline data={TRUST_HISTORY.map(v => v - 50 + Math.round(farmer.score / 850 * 100))} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Factor contributions" icon={ShieldCheck}>
          <ShapBars positive={SHAP_FACTORS.positive} negative={SHAP_FACTORS.negative} />
        </Card>
        <Card title="Rainfall (12 mo.)" icon={CloudRain}>
          <Bars data={RAINFALL} />
        </Card>
      </div>

      <Card title="Relationship network" icon={Users}>
        <NetworkGraph centerLabel={farmer.name.split(" ")[0]} />
      </Card>

      <Card title="Timeline">
        <ul className="space-y-3 text-sm">
          {[
            ["2026-06-21", "Loan application submitted", "Pending review"],
            ["2026-05-04", "Mobile money pattern updated", "Trust +6"],
            ["2026-04-12", "Cooperative training attended", "Behavior +"],
            ["2026-02-01", "Previous loan repaid in full", "Repayment +12"],
          ].map(([d, t, m]) => (
            <li key={d} className="flex items-start gap-4 rounded-xl bg-surface-elevated/60 p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{d}</span>
              <span className="flex-1">{t}</span>
              <span className="text-xs text-emerald">{m}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
