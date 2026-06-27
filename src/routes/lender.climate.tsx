import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CloudRain, Droplets, Map as MapIcon, Thermometer } from "lucide-react";
import { Card, KpiCard, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { COUNTY_TRUST } from "@/lib/mock-data";

export const Route = createFileRoute("/lender/climate")({
  component: ClimatePage,
});

function ClimatePage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Climate-aware lending" title="Climate Intelligence" sub="County-level weather, drought and flood risk." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="High-risk counties" value="3" tone="rose" icon={CloudRain} sub="Garissa, Turkana, Machakos" />
        <KpiCard label="Drought index" value="0.62" tone="gold" icon={Thermometer} sub="Moderate" />
        <KpiCard label="Avg rainfall (mm)" value="48" tone="sky" icon={Droplets} sub="Above seasonal" />
        <KpiCard label="NDVI" value="0.64" tone="emerald" icon={MapIcon} sub="Stable" />
      </div>
      <Card title="County risk map" icon={MapIcon}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {COUNTY_TRUST.map((c) => {
            const color = c.risk === "Low" ? "var(--emerald)" : c.risk === "Med" ? "var(--gold)" : "var(--rose)";
            return (
              <div key={c.name} className="rounded-xl p-3 text-xs" style={{ background: `color-mix(in oklab, ${color} 18%, transparent)`, border: `1px solid color-mix(in oklab, ${color} 40%, transparent)` }}>
                <div className="font-semibold">{c.name}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{c.risk} risk</div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="Active alerts" icon={AlertTriangle}>
        <ul className="space-y-2 text-sm">
          {[
            ["Drought intensifying in Machakos & Garissa", "rose"],
            ["Flood watch issued for Kisumu lakeshore", "sky"],
            ["Coffee berry disease risk rising in central highlands", "gold"],
          ].map(([t, tone]) => (
            <li key={t as string} className="flex items-center justify-between rounded-xl bg-surface-elevated/60 p-3">
              <span>{t}</span>
              <Tag label="Climate" tone={tone as "rose" | "sky" | "gold"} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
