import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Brain, BadgeInfo, RefreshCw } from "lucide-react";
import { Card, Gauge, SectionTitle, ShapBars } from "@/components/dashboard/primitives";
import { getMyTrustScore } from "@/lib/farmer-data.functions";
import { computeMyTrustScore } from "@/lib/trust-score.functions";

export const Route = createFileRoute("/farmer/trust-score")({
  component: TrustScorePage,
});

function TrustScorePage() {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyTrustScore);
  const computeFn = useServerFn(computeMyTrustScore);
  const ts = useQuery({ queryKey: ["trust", "mine"], queryFn: () => getFn() });
  const compute = useMutation({
    mutationFn: () => computeFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trust"] }),
  });

  const score = ts.data?.score ?? 0;
  const components = (ts.data?.components ?? {}) as Record<string, number>;
  const subs = [
    { l: "Behavior", v: Math.round(components.behavior ?? 0), c: "var(--emerald)" },
    { l: "Financial", v: Math.round(components.financial ?? 0), c: "var(--sky)" },
    { l: "Community", v: Math.round(components.community ?? 0), c: "var(--violet)" },
    { l: "Agricultural", v: Math.round(components.agricultural ?? 0), c: "var(--gold)" },
    { l: "Climate", v: Math.round(components.climate ?? 0), c: "var(--emerald-glow)" },
    { l: "Digital", v: Math.round(components.digital ?? 0), c: "var(--rose)" },
  ];
  const pos = (ts.data?.top_positive_factors ?? []).map((label, i) => ({ l: label, v: 12 - i * 2 }));
  const neg = (ts.data?.top_negative_factors ?? []).map((label, i) => ({ l: label, v: 8 - i * 2 }));

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Explainable AI" title="Trust Score" sub="Every score comes with a reason."
        right={
          <button onClick={() => compute.mutate()} disabled={compute.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${compute.isPending ? "animate-spin" : ""}`} />
            {compute.isPending ? "Recomputing…" : "Recompute"}
          </button>
        }
      />

      {!ts.data && !ts.isLoading && (
        <Card><p className="text-sm text-muted-foreground">No trust score yet. Click <strong>Recompute</strong> to generate your first score.</p></Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card title="Overall score" icon={ShieldCheck}>
          <div className="flex flex-col items-center py-3">
            <Gauge score={score} />
            <div className="mt-2 rounded-full bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald">
              {ts.data?.climate_risk ? `Climate · ${ts.data.climate_risk}` : "Awaiting computation"}
            </div>
          </div>
        </Card>

        <Card title="Sub-scores">
          <div className="grid gap-4 sm:grid-cols-2">
            {subs.map((s) => (
              <div key={s.l}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{s.l}</span>
                  <span className="font-mono font-semibold">{s.v}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-elevated">
                  <div className="h-full rounded-full" style={{ width: `${s.v}%`, background: s.c }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Factor contributions" icon={Brain}>
          {pos.length + neg.length > 0
            ? <ShapBars positive={pos} negative={neg} />
            : <p className="text-sm text-muted-foreground">Recompute your score to see contributing factors.</p>}
        </Card>
        <Card title="Recommendations" icon={BadgeInfo}>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {((ts.data?.recommendations ?? []) as string[]).map((r) => <li key={r}>• {r}</li>)}
            {((ts.data?.recommendations ?? []) as string[]).length === 0 && <li>• Add more farm records to unlock personalized recommendations.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
