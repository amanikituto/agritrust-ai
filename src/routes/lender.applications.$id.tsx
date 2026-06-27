import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Brain, CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { Card, Gauge, KpiCard, SectionTitle, ShapBars, Tag } from "@/components/dashboard/primitives";
import { findApplicant, SHAP_FACTORS } from "@/lib/mock-data";

export const Route = createFileRoute("/lender/applications/$id")({
  loader: ({ params }) => {
    const farmer = findApplicant(params.id);
    if (!farmer) throw notFound();
    return { farmer };
  },
  component: DecisionWorkspace,
});

function DecisionWorkspace() {
  const { farmer } = Route.useLoaderData();
  const [decision, setDecision] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <Link to="/lender/applications" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to queue
      </Link>

      <SectionTitle
        eyebrow="Decision workspace"
        title={`Application · ${farmer.name}`}
        sub={`${farmer.cooperative} · ${farmer.county} · ${farmer.crop}`}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card title="Trust Score" icon={ShieldCheck}>
          <div className="flex flex-col items-center py-2">
            <Gauge score={farmer.score} />
            <Tag label={`${(farmer.conf * 100).toFixed(0)}% confidence`} tone="emerald" />
          </div>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard label="Requested" value={`KES ${farmer.amount.toLocaleString()}`} tone="sky" icon={ShieldCheck} />
          <KpiCard label="Term (suggested)" value="9 months" tone="emerald" icon={Clock} />
          <KpiCard label="Climate risk" value={farmer.climate} tone={farmer.climate === "Low" ? "emerald" : farmer.climate === "Med" ? "gold" : "rose"} icon={ShieldCheck} />
          <KpiCard label="AI recommendation" value={farmer.rec} tone={farmer.rec === "Approve" ? "emerald" : farmer.rec === "Decline" ? "rose" : "sky"} icon={Brain} />
        </div>
      </div>

      <Card title="Explainability · SHAP" icon={Brain}>
        <ShapBars positive={SHAP_FACTORS.positive} negative={SHAP_FACTORS.negative} />
        <div className="mt-4 rounded-xl bg-surface-elevated/60 p-3 text-xs text-muted-foreground">
          <strong className="text-foreground">Bias check:</strong> Decision robust to gender, age, and county swaps. Model v1.4 · Human review recommended for amounts &gt; KES 500,000.
        </div>
      </Card>

      <Card title="Decision">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: "Approve", t: "emerald" as const, Icon: CheckCircle2 },
            { l: "Conditional", t: "sky" as const, Icon: Clock },
            { l: "Manual review", t: "gold" as const, Icon: Brain },
            { l: "Reject", t: "rose" as const, Icon: XCircle },
          ].map(({ l, t, Icon }) => (
            <button
              key={l}
              onClick={() => setDecision(l)}
              className={`flex items-center justify-center gap-2 rounded-xl border border-border/40 px-4 py-3 text-sm font-semibold transition ${
                decision === l ? `bg-${t}/10 text-${t}` : "bg-surface-elevated/60 hover:bg-surface-elevated"
              }`}
              style={decision === l ? { borderColor: `var(--${t})` } : undefined}
            >
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </div>
        {decision && (
          <div className="mt-4 rounded-xl bg-emerald/10 p-3 text-sm text-emerald">
            <strong>{decision}</strong> recorded · audit log entry created · farmer will be notified.
          </div>
        )}
      </Card>
    </div>
  );
}
