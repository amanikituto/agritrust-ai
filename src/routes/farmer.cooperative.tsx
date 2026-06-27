import { createFileRoute } from "@tanstack/react-router";
import { Users, Trophy, GraduationCap } from "lucide-react";
import { Card, KpiCard, SectionTitle } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/farmer/cooperative")({
  component: CoopPage,
});

function CoopPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Community" title="Cooperative" sub="Kiambu Coffee Coop · 240 members" />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="My rank" value="#12 / 240" tone="gold" icon={Trophy} sub="Top 5% performers" />
        <KpiCard label="Tenure" value="5 yrs" tone="emerald" icon={Users} sub="Strong centrality" />
        <KpiCard label="Trainings attended" value="14" tone="sky" icon={GraduationCap} sub="2 upcoming" />
      </div>
      <Card title="Upcoming trainings">
        <ul className="divide-y divide-border/60">
          {[
            ["Climate-smart coffee — 3 Jul", "Open"],
            ["Mobile money for cooperatives — 10 Jul", "Open"],
            ["Crop insurance basics — 18 Jul", "Open"],
          ].map(([t, s]) => (
            <li key={t} className="flex items-center justify-between py-3">
              <span className="text-sm">{t}</span>
              <span className="rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald">{s}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Top members this quarter">
        <ul className="divide-y divide-border/60">
          {["Mary W.","Peter K.","Grace O.","John K. (you)","Esther M."].map((n, i) => (
            <li key={n} className="flex items-center justify-between py-3 text-sm">
              <span className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-surface-elevated text-[10px] font-bold">{i+1}</span>{n}</span>
              <span className="font-mono text-xs text-muted-foreground">{800 - i * 14}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
