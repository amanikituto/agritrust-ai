import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Card, SectionTitle } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/farmer/credit")({
  component: CreditPage,
});

type Item = { l: string; status: "done" | "progress" | "attention"; how: string };

const ITEMS: Item[] = [
  { l: "Verified identity", status: "done", how: "Linked national ID." },
  { l: "Farm verified", status: "done", how: "GPS + cooperative letter on file." },
  { l: "Mobile money history (12 mo.)", status: "done", how: "M-Pesa linked Jan 2025." },
  { l: "Repayment records", status: "done", how: "3 loans repaid on time." },
  { l: "Production records", status: "progress", how: "Log next 2 harvests to complete." },
  { l: "Savings consistency", status: "progress", how: "Save KES 300/week for 8 more weeks." },
  { l: "Cooperative membership", status: "done", how: "5 years at Kiambu Coffee Coop." },
  { l: "Crop insurance", status: "attention", how: "Purchase KCB Bima or APA cover." },
  { l: "Climate data", status: "done", how: "Auto-pulled from Open-Meteo." },
  { l: "Financial records", status: "progress", how: "Upload last 3 months of statements." },
];

const ICON = {
  done: { Icon: CheckCircle2, c: "text-emerald bg-emerald/10" },
  progress: { Icon: Clock, c: "text-sky bg-sky/10" },
  attention: { Icon: AlertCircle, c: "text-gold bg-gold/10" },
};

function CreditPage() {
  const done = ITEMS.filter((i) => i.status === "done").length;
  const pct = Math.round((done / ITEMS.length) * 100);
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Credit" title="Credit Readiness" sub="Tick off requirements to unlock larger loans." />
      <Card title={`You are ${pct}% credit-ready`}>
        <div className="h-3 overflow-hidden rounded-full bg-surface-elevated">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald to-emerald-glow" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 text-xs text-muted-foreground">{done} of {ITEMS.length} complete</div>
      </Card>

      <div className="grid gap-3">
        {ITEMS.map((it) => {
          const { Icon, c } = ICON[it.status];
          return (
            <div key={it.l} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl glass p-4">
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${c}`}>
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{it.l}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{it.how}</div>
              </div>
              {it.status !== "done" && (
                <button className="shrink-0 rounded-lg bg-emerald/10 px-3 py-1.5 text-xs font-semibold text-emerald hover:bg-emerald/20">
                  How to improve
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
