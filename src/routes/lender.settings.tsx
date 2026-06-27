import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/lender/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Institution" title="Settings" sub="Manage institution profile, policies and integrations." />
      <Card title="Institution" icon={Building2}>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Name", "Equity Agri Lending"],
            ["Type", "Commercial Bank"],
            ["Country", "Kenya"],
            ["Regulator", "Central Bank of Kenya"],
            ["Branches", "187"],
            ["Loan officers", "412"],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-surface-elevated/60 p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{l}</div>
              <div className="mt-1.5 text-sm font-medium">{v}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Policy thresholds">
        <ul className="divide-y divide-border/60 text-sm">
          {[
            ["Auto-approve threshold", "Score ≥ 740 & amount ≤ KES 150k"],
            ["Manual review", "Amount > KES 500k OR climate risk = High"],
            ["Maximum LTV", "65%"],
            ["Bias check cadence", "Quarterly"],
          ].map(([l, v]) => (
            <li key={l} className="flex items-center justify-between py-3"><span>{l}</span><Tag label={v} tone="sky" /></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
