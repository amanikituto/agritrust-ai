import { createFileRoute } from "@tanstack/react-router";
import { Brain, ShieldAlert } from "lucide-react";
import { Card, SectionTitle, ShapBars, Tag } from "@/components/dashboard/primitives";
import { APPLICANTS, SHAP_FACTORS } from "@/lib/mock-data";

export const Route = createFileRoute("/lender/explainability")({
  component: ExplainPage,
});

function ExplainPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Explainable AI" title="Decision Explainability" sub="Every recommendation comes with a reason." />
      <div className="grid gap-4 lg:grid-cols-2">
        {APPLICANTS.slice(0, 4).map((a) => (
          <Card key={a.id} title={`${a.name} · ${a.rec}`} icon={Brain}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Tag label={`Score ${a.score}`} tone="emerald" />
              <Tag label={`${(a.conf*100).toFixed(0)}% confidence`} tone="sky" />
              <Tag label={`${a.climate} climate`} tone={a.climate === "Low" ? "emerald" : a.climate === "Med" ? "gold" : "rose"} />
            </div>
            <ShapBars positive={SHAP_FACTORS.positive.slice(0, 3)} negative={SHAP_FACTORS.negative.slice(0, 2)} />
          </Card>
        ))}
      </div>
      <Card title="Bias monitoring" icon={ShieldAlert}>
        <ul className="space-y-2 text-sm">
          {[
            ["Gender approval gap", "2.1 pts", true],
            ["Disability approval gap", "1.4 pts", true],
            ["Youth approval gap", "5.8 pts", false],
            ["Regional disparity", "3.2 pts", true],
          ].map(([l, v, ok]) => (
            <li key={l as string} className="flex items-center justify-between rounded-xl bg-surface-elevated/60 p-3">
              <span>{l}</span>
              <Tag label={`${v} ${ok ? "OK" : "Review"}`} tone={ok ? "emerald" : "gold"} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
