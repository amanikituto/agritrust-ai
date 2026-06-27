import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Bars, Card, KpiCard, SectionTitle, Tag } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/lender/risk")({
  component: RiskPage,
});

function RiskPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Governance" title="Risk Management" sub="Default prediction, concentration and climate-adjusted risk." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="VaR (95%)" value="4.2%" tone="gold" icon={ShieldAlert} />
        <KpiCard label="Concentration risk" value="Low" tone="emerald" icon={ShieldAlert} sub="HHI 0.14" />
        <KpiCard label="Climate-adjusted PD" value="3.8%" tone="gold" icon={ShieldAlert} />
        <KpiCard label="Stress test (drought)" value="−1.4%" tone="rose" icon={ShieldAlert} sub="ROP impact" />
      </div>
      <Card title="Default probability distribution">
        <Bars data={[40,55,72,84,68,52,38,24,16,10]} color="oklch(0.7 0.2 18 / 0.75)" />
      </Card>
      <Card title="Watchlist">
        <ul className="divide-y divide-border/60 text-sm">
          {[
            ["High-LTV applicants > KES 250k", "12 cases", "gold"],
            ["Drought-exposed in Machakos", "7 cases", "rose"],
            ["Youth segment delinquency", "4 cases", "gold"],
          ].map(([t, c, tone]) => (
            <li key={t as string} className="flex items-center justify-between py-3">
              <span>{t}</span>
              <Tag label={c as string} tone={tone as "gold" | "rose"} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
