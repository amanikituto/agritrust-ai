import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CloudRain, Droplets, Map as MapIcon, Thermometer } from "lucide-react";
import { Card, KpiCard, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { getClimate, type ClimateData } from "@/lib/climate.functions";

export const Route = createFileRoute("/lender/climate")({
  component: ClimatePage,
});

const COUNTIES = [
  "Kiambu", "Nyeri", "Murang'a", "Nakuru", "Kisumu", "Trans Nzoia",
  "Meru", "Kakamega", "Machakos", "Bungoma", "Uasin Gishu", "Embu", "Garissa", "Turkana",
];

function ClimatePage() {
  const fetchClimate = useServerFn(getClimate);
  const queries = useQueries({
    queries: COUNTIES.map((c) => ({
      queryKey: ["climate", c],
      queryFn: () => fetchClimate({ data: { county: c } }),
      staleTime: 10 * 60_000,
    })),
  });

  const results = queries.map((q, i) => ({ county: COUNTIES[i], data: q.data as ClimateData | undefined }));
  const loaded = results.filter((r) => r.data);
  const high = loaded.filter((r) => r.data!.droughtIndex === "High");
  const avgRain = loaded.length ? Math.round(loaded.reduce((a, r) => a + r.data!.rainfall7d, 0) / loaded.length) : 0;
  const avgTemp = loaded.length ? +(loaded.reduce((a, r) => a + r.data!.current.temperatureC, 0) / loaded.length).toFixed(1) : 0;
  const avgNdvi = loaded.length
    ? +(loaded.reduce((a, r) => a + (r.data!.ndvi12mo.at(-1) ?? 0), 0) / loaded.length).toFixed(2)
    : 0;

  const alerts = loaded
    .flatMap((r) => r.data!.alerts.filter((a) => a.tone === "rose" || a.tone === "sky").map((a) => ({ ...a, county: r.county })))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Climate-aware lending" title="Climate Intelligence" sub="County-level weather, drought and flood risk · Open-Meteo." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="High-risk counties" value={`${high.length}`} tone="rose" icon={CloudRain} sub={high.map((h) => h.county).join(", ") || "None"} />
        <KpiCard label="Avg temperature" value={`${avgTemp || "—"} °C`} tone="gold" icon={Thermometer} sub="Across portfolio" />
        <KpiCard label="Avg rainfall (7d)" value={`${avgRain} mm`} tone="sky" icon={Droplets} sub="County mean" />
        <KpiCard label="Avg NDVI" value={avgNdvi ? avgNdvi.toFixed(2) : "—"} tone="emerald" icon={MapIcon} sub="Vegetation proxy" />
      </div>
      <Card title="County risk map" icon={MapIcon}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {results.map(({ county, data }) => {
            const risk = data?.droughtIndex ?? "Med";
            const color = risk === "Low" ? "var(--emerald)" : risk === "Med" ? "var(--gold)" : "var(--rose)";
            return (
              <div
                key={county}
                className="rounded-xl p-3 text-xs"
                style={{
                  background: `color-mix(in oklab, ${color} 18%, transparent)`,
                  border: `1px solid color-mix(in oklab, ${color} 40%, transparent)`,
                }}
              >
                <div className="font-semibold">{county}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {data ? `${risk} risk · ${data.rainfall7d}mm` : "Loading…"}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card title="Active alerts" icon={AlertTriangle}>
        <ul className="space-y-2 text-sm">
          {alerts.length ? alerts.map((a, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-surface-elevated/60 p-3">
              <span>{a.t}</span>
              <Tag label={a.county} tone={a.tone} />
            </li>
          )) : (
            <li className="text-xs text-muted-foreground">No active climate alerts across portfolio.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
