import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Ruler, Sprout, Camera, Calendar, Droplets } from "lucide-react";
import { Bars, Card, KpiCard, SectionTitle } from "@/components/dashboard/primitives";
import { PRODUCTION } from "@/lib/mock-data";

export const Route = createFileRoute("/farmer/farm")({
  component: FarmPage,
});

function FarmPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Farm" title="Farm Profile" sub="Your farm details power Climate AI and Trust Score." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Farm size" value="2.4 ac" tone="emerald" icon={Ruler} />
        <KpiCard label="Primary crop" value="Coffee" tone="sky" icon={Sprout} />
        <KpiCard label="Last harvest" value="225 kg" tone="gold" icon={Calendar} sub="+15% vs last" />
        <KpiCard label="Irrigation" value="Rain-fed" tone="sky" icon={Droplets} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Production trend (kg / month)" icon={Sprout}>
          <Bars data={PRODUCTION} />
        </Card>
        <Card title="Location & plots" icon={MapPin}>
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-gradient-to-br from-emerald/20 via-sky/10 to-violet/20">
            <svg viewBox="0 0 400 300" className="h-full w-full">
              <rect x="40" y="50" width="140" height="100" fill="oklch(0.72 0.18 155 / 0.35)" stroke="var(--emerald)" />
              <rect x="200" y="40" width="170" height="80" fill="oklch(0.83 0.15 85 / 0.3)" stroke="var(--gold)" />
              <rect x="60" y="170" width="240" height="100" fill="oklch(0.78 0.13 230 / 0.3)" stroke="var(--sky)" />
              <text x="110" y="105" textAnchor="middle" fontSize="11" fill="currentColor" className="text-foreground">Plot A · Coffee</text>
              <text x="285" y="85" textAnchor="middle" fontSize="11" fill="currentColor" className="text-foreground">Plot B · Maize</text>
              <text x="180" y="225" textAnchor="middle" fontSize="11" fill="currentColor" className="text-foreground">Plot C · Beans</text>
            </svg>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">Lat -1.1714, Lng 36.8356 · Kiambu</div>
        </Card>
      </div>

      <Card title="Plot photos" icon={Camera}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="aspect-square rounded-xl bg-gradient-to-br from-emerald/30 to-forest/40" />
          ))}
        </div>
      </Card>
    </div>
  );
}
