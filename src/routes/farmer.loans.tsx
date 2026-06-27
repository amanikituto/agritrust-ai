import { createFileRoute } from "@tanstack/react-router";
import { PlusCircle, Wallet, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/farmer/loans")({
  component: LoansPage,
});

const LOANS = [
  { id: "L-2026-0118", amount: 120000, purpose: "Inputs · Coffee", status: "Pending", date: "2026-06-21" },
  { id: "L-2025-0942", amount: 80000,  purpose: "Equipment", status: "Repaid", date: "2025-09-04" },
  { id: "L-2025-0511", amount: 50000,  purpose: "Seeds", status: "Repaid", date: "2025-03-12" },
  { id: "L-2024-1208", amount: 60000,  purpose: "Inputs · Maize", status: "Repaid", date: "2024-11-18" },
];

const TONE = { Pending: "sky", Repaid: "emerald", Declined: "rose" } as const;
const ICON = { Pending: Clock, Repaid: CheckCircle2, Declined: XCircle };

function LoansPage() {
  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Financing"
        title="Loan Applications"
        sub="Track current and past financing."
        right={
          <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110">
            <PlusCircle className="h-4 w-4" /> New application
          </button>
        }
      />

      <Card title="Pre-qualification" icon={Wallet}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-elevated/60 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Eligible up to</div>
            <div className="mt-1 text-2xl font-bold">KES 200,000</div>
          </div>
          <div className="rounded-xl bg-surface-elevated/60 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Suggested term</div>
            <div className="mt-1 text-2xl font-bold">9 months</div>
          </div>
          <div className="rounded-xl bg-surface-elevated/60 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Indicative APR</div>
            <div className="mt-1 text-2xl font-bold">14.5%</div>
          </div>
        </div>
      </Card>

      <Card title="History">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Ref</th>
                <th className="px-3 py-2">Purpose</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {LOANS.map((l) => {
                const Icon = ICON[l.status as keyof typeof ICON];
                return (
                  <tr key={l.id} className="hover:bg-surface-elevated/40">
                    <td className="px-3 py-3 font-mono text-xs">{l.id}</td>
                    <td className="px-3 py-3">{l.purpose}</td>
                    <td className="px-3 py-3 font-semibold">KES {l.amount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-muted-foreground">{l.date}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        <Tag label={l.status} tone={TONE[l.status as keyof typeof TONE]} />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
