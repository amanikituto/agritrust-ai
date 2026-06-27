import { createFileRoute } from "@tanstack/react-router";
import { CloudRain, Thermometer, Droplets, Leaf, AlertTriangle } from "lucide-react";
import { Bars, Card, KpiCard, SectionTitle, Sparkline, Tag } from "@/components/dashboard/primitives";
import { RAINFALL } from "@/lib/mock-data";

export const Route = createFileRoute("/farmer/climate")({
  component: ClimatePage,
});

function ClimatePage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Climate" title="Climate Intelligence" sub="Weather, vegetation and risk for your farm." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Rainfall (7d)" value="48 mm" tone="sky" icon={Droplets} sub="Above average" />
        <KpiCard label="Temperature" value="22.4 °C" tone="gold" icon={Thermometer} sub="Normal" />
        <KpiCard label="Drought index" value="Low" tone="emerald" icon={CloudRain} sub="SPI 0.4" />
        <KpiCard label="NDVI" value="0.71" tone="emerald" icon={Leaf} sub="Healthy canopy" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Rainfall (12 mo.)" icon={Droplets}>
          <Bars data={RAINFALL} />
        </Card>
        <Card title="NDVI vegetation trend" icon={Leaf}>
          <Sparkline data={[0.42,0.48,0.55,0.6,0.63,0.65,0.68,0.7,0.71,0.7,0.72,0.71].map(v=>v*100)} color="oklch(0.72 0.18 155)" />
        </Card>
      </div>

      <Card title="Active alerts" icon={AlertTriangle}>
        <ul className="space-y-3">
          {[
            { t: "Heavy rainfall expected Thursday — secure stored grain", tone: "sky" as const },
            { t: "Coffee berry disease risk rising in highland zones", tone: "gold" as const },
            { t: "Recommend planting drought-tolerant maize for next season", tone: "emerald" as const },
          ].map((a) => (
            <li key={a.t} className="flex items-center justify-between rounded-xl bg-surface-elevated/60 p-3 text-sm">
              <span>{a.t}</span>
              <Tag label={a.tone === "sky" ? "Watch" : a.tone === "gold" ? "Caution" : "Tip"} tone={a.tone} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
