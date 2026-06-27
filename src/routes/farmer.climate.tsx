import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CloudRain, Thermometer, Droplets, Leaf, AlertTriangle } from "lucide-react";
import { Bars, Card, KpiCard, SectionTitle, Sparkline, Tag } from "@/components/dashboard/primitives";
import { getClimate } from "@/lib/climate.functions";

export const Route = createFileRoute("/farmer/climate")({
  component: ClimatePage,
});

function ClimatePage() {
  const fetchClimate = useServerFn(getClimate);
  const { data, isLoading } = useQuery({
    queryKey: ["climate", "Kiambu"],
    queryFn: () => fetchClimate({ data: { county: "Kiambu" } }),
  });

  const droughtTone = data?.droughtIndex === "Low" ? "emerald" : data?.droughtIndex === "Med" ? "gold" : "rose";
  const ndviAvg = data ? data.ndvi12mo[data.ndvi12mo.length - 1] : 0;

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Climate"
        title="Climate Intelligence"
        sub={data ? `Live conditions for ${data.location.name} · ${data.source === "open-meteo" ? "Open-Meteo" : "Cached"}` : "Loading conditions…"}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Rainfall (7d)" value={`${data?.rainfall7d ?? "—"} mm`} tone="sky" icon={Droplets} sub={isLoading ? "Loading…" : "Last 7 days"} />
        <KpiCard label="Temperature" value={`${data ? data.current.temperatureC.toFixed(1) : "—"} °C`} tone="gold" icon={Thermometer} sub={`Humidity ${data?.current.humidity ?? "—"}%`} />
        <KpiCard label="Drought index" value={data?.droughtIndex ?? "—"} tone={droughtTone} icon={CloudRain} sub="Vs seasonal avg" />
        <KpiCard label="NDVI" value={ndviAvg ? ndviAvg.toFixed(2) : "—"} tone="emerald" icon={Leaf} sub="Vegetation proxy" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Rainfall (12 mo.)" icon={Droplets}>
          <Bars data={data?.rainfall12mo ?? []} />
        </Card>
        <Card title="NDVI vegetation trend" icon={Leaf}>
          <Sparkline data={(data?.ndvi12mo ?? []).map((v) => v * 100)} color="oklch(0.72 0.18 155)" />
        </Card>
      </div>

      <Card title="Active alerts" icon={AlertTriangle}>
        <ul className="space-y-3">
          {(data?.alerts ?? []).map((a) => (
            <li key={a.t} className="flex items-center justify-between rounded-xl bg-surface-elevated/60 p-3 text-sm">
              <span>{a.t}</span>
              <Tag label={a.tone === "sky" ? "Watch" : a.tone === "gold" ? "Caution" : a.tone === "rose" ? "Alert" : "Tip"} tone={a.tone} />
            </li>
          ))}
          {!data?.alerts.length && <li className="text-xs text-muted-foreground">Loading alerts…</li>}
        </ul>
        {data?.error && <p className="mt-2 text-xs text-rose">{data.error}</p>}
      </Card>
    </div>
  );
}
