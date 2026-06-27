import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CheckCircle2, Layers, TrendingUp } from "lucide-react";
import { Bars, Card, Donut, KpiCard, SectionTitle, Sparkline } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/lender/portfolio")({
  component: PortfolioPage,
});

function PortfolioPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Performance" title="Portfolio Analytics" sub="Institution-wide KPIs and trends." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Portfolio value" value="KES 2.4B" tone="emerald" icon={Layers} />
        <KpiCard label="Approval rate" value="71.5%" tone="emerald" icon={CheckCircle2} />
        <KpiCard label="Default rate" value="3.1%" tone="gold" icon={BarChart3} sub="−0.6 QoQ" />
        <KpiCard label="ROP" value="9.2%" tone="emerald" icon={TrendingUp} sub="Return on portfolio" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Portfolio growth (12 mo.)" className="lg:col-span-2">
          <Sparkline data={[1.4,1.5,1.55,1.62,1.7,1.78,1.86,1.95,2.05,2.18,2.3,2.4].map(v => v * 100)} />
        </Card>
        <Card title="Crop mix">
          <Donut segments={[
            { label: "Coffee", value: 28, color: "var(--emerald)" },
            { label: "Tea", value: 18, color: "var(--sky)" },
            { label: "Maize", value: 22, color: "var(--gold)" },
            { label: "Dairy", value: 14, color: "var(--violet)" },
            { label: "Other", value: 18, color: "var(--rose)" },
          ]} />
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Disbursements / month (KES M)">
          <Bars data={[120,135,148,162,170,180,195,205,220,235,250,268]} color="oklch(0.72 0.18 155 / 0.85)" />
        </Card>
        <Card title="Expected loss (basis points)">
          <Bars data={[42,38,40,36,32,30,28,29,27,26,24,22]} color="oklch(0.7 0.2 18 / 0.7)" />
        </Card>
      </div>
    </div>
  );
}
