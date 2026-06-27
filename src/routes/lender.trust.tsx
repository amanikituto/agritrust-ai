import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Bars, Card, KpiCard, SectionTitle } from "@/components/dashboard/primitives";
import { APPLICANTS } from "@/lib/mock-data";

export const Route = createFileRoute("/lender/trust")({
  component: TrustPage,
});

function TrustPage() {
  const buckets = [0,0,0,0,0,0];
  APPLICANTS.forEach((a) => {
    const i = Math.min(5, Math.floor((a.score - 500) / 50));
    if (i >= 0) buckets[i]++;
  });
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Risk" title="Trust Score Distribution" sub="Portfolio-wide score spread." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Avg trust" value="694" tone="emerald" icon={ShieldCheck} />
        <KpiCard label="Median" value="701" tone="emerald" icon={ShieldCheck} />
        <KpiCard label="Top decile" value="812+" tone="gold" icon={ShieldCheck} />
        <KpiCard label="At-risk (<600)" value={`${APPLICANTS.filter(a => a.score < 600).length}`} tone="rose" icon={ShieldCheck} />
      </div>
      <Card title="Score buckets (500–800)">
        <Bars data={buckets} />
        <div className="mt-2 grid grid-cols-6 text-center text-[10px] text-muted-foreground">
          {["500","550","600","650","700","750+"].map(l => <div key={l}>{l}</div>)}
        </div>
      </Card>
    </div>
  );
}
