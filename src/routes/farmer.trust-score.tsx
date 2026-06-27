import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Brain, BadgeInfo } from "lucide-react";
import { Card, Gauge, SectionTitle, ShapBars } from "@/components/dashboard/primitives";
import { SHAP_FACTORS } from "@/lib/mock-data";

export const Route = createFileRoute("/farmer/trust-score")({
  component: TrustScorePage,
});

const SUBSCORES = [
  { l: "Behavior", v: 88, c: "var(--emerald)" },
  { l: "Financial", v: 74, c: "var(--sky)" },
  { l: "Community", v: 91, c: "var(--violet)" },
  { l: "Agricultural", v: 82, c: "var(--gold)" },
  { l: "Climate", v: 79, c: "var(--emerald-glow)" },
  { l: "Digital ID", v: 95, c: "var(--rose)" },
];

function TrustScorePage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Explainable AI" title="Trust Score" sub="Every score comes with a reason." />

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card title="Overall score" icon={ShieldCheck}>
          <div className="flex flex-col items-center py-3">
            <Gauge score={742} />
            <div className="mt-2 rounded-full bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald">
              Confidence 92%
            </div>
          </div>
        </Card>

        <Card title="Sub-scores">
          <div className="grid gap-4 sm:grid-cols-2">
            {SUBSCORES.map((s) => (
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
        <Card title="Factor contributions (SHAP)" icon={Brain}>
          <ShapBars positive={SHAP_FACTORS.positive} negative={SHAP_FACTORS.negative} />
        </Card>
        <Card title="Plain-language explanation" icon={BadgeInfo}>
          <div className="space-y-3 text-sm leading-relaxed">
            <p>Your Trust Score is <strong className="text-emerald">742</strong> because:</p>
            <ul className="space-y-1.5 text-muted-foreground">
              <li>• Excellent repayment history on 3 previous loans</li>
              <li>• Active 5-year cooperative membership with strong relationships</li>
              <li>• Consistent mobile money flow (KES 184k / 90d)</li>
              <li>• Low climate exposure in Kiambu — rainfall stable</li>
              <li>• Verified production records over 4 seasons</li>
            </ul>
            <p>To reach <strong className="text-emerald">800+</strong>: build savings consistency and add crop insurance.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
