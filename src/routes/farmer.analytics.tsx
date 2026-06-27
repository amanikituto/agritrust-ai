import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, PiggyBank, Sprout, TrendingUp } from "lucide-react";
import { Bars, Card, KpiCard, SectionTitle, Sparkline } from "@/components/dashboard/primitives";
import { INCOME, PRODUCTION, SAVINGS } from "@/lib/mock-data";

export const Route = createFileRoute("/farmer/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Insights" title="Farm Analytics" sub="Productivity, income and financial behavior." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Monthly income" value="KES 42k" tone="emerald" icon={TrendingUp} sub="+8% MoM" />
        <KpiCard label="Savings 90d" value="+22%" tone="emerald" icon={PiggyBank} />
        <KpiCard label="Production" value="225 kg" tone="gold" icon={Sprout} sub="last harvest" />
        <KpiCard label="Mobile money" value="KES 184k" tone="sky" icon={BarChart3} sub="90d volume" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Income (KES thousand)"><Sparkline data={INCOME} /></Card>
        <Card title="Savings growth"><Sparkline data={SAVINGS} color="oklch(0.83 0.15 85)" /></Card>
        <Card title="Production (kg / month)"><Bars data={PRODUCTION} /></Card>
        <Card title="Mobile money activity"><Bars data={[12,15,18,14,22,28,24,30,35,32,38,42]} color="oklch(0.78 0.13 230 / 0.85)" /></Card>
      </div>
    </div>
  );
}
