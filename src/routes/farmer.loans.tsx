import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PlusCircle, Wallet, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { applyForLoan, listMyLoans } from "@/lib/loans.functions";
import { getMyTrustScore } from "@/lib/farmer-data.functions";

export const Route = createFileRoute("/farmer/loans")({
  component: LoansPage,
});

const TONE: Record<string, "sky" | "emerald" | "rose" | "gold" | "violet"> = {
  submitted: "sky", under_review: "sky", approved: "emerald",
  disbursed: "emerald", repaid: "emerald", rejected: "rose", draft: "gold",
};
const ICON: Record<string, typeof Clock> = {
  submitted: Clock, under_review: Clock, approved: CheckCircle2,
  disbursed: CheckCircle2, repaid: CheckCircle2, rejected: XCircle, draft: Clock,
};

function LoansPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyLoans);
  const tsFn = useServerFn(getMyTrustScore);
  const applyFn = useServerFn(applyForLoan);

  const loans = useQuery({ queryKey: ["loans", "mine"], queryFn: () => listFn() });
  const ts = useQuery({ queryKey: ["trust", "mine"], queryFn: () => tsFn() });

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(50000);
  const [term, setTerm] = useState(9);
  const [purpose, setPurpose] = useState("Seeds & inputs");

  const apply = useMutation({
    mutationFn: () => applyFn({ data: { amount_kes: amount, term_months: term, purpose } }),
    onSuccess: () => { setOpen(false); qc.invalidateQueries({ queryKey: ["loans"] }); },
  });

  const eligible = ts.data?.loan_eligibility_kes ?? 0;

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Financing" title="Loan Applications" sub="Track current and past financing."
        right={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110">
            <PlusCircle className="h-4 w-4" /> New application
          </button>
        }
      />

      <Card title="Pre-qualification" icon={Wallet}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-elevated/60 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Eligible up to</div>
            <div className="mt-1 text-2xl font-bold">KES {eligible.toLocaleString()}</div>
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

      {open && (
        <Card title="New application">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Amount (KES)
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border/60 bg-surface-elevated/60 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">Term (months)
              <input type="number" value={term} onChange={(e) => setTerm(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-border/60 bg-surface-elevated/60 px-3 py-2 text-sm" />
            </label>
            <label className="text-sm">Purpose
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)}
                className="mt-1 w-full rounded-md border border-border/60 bg-surface-elevated/60 px-3 py-2 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button disabled={apply.isPending} onClick={() => apply.mutate()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {apply.isPending ? "Submitting…" : "Submit"}
            </button>
            <button onClick={() => setOpen(false)} className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
          {apply.error && <p className="mt-2 text-xs text-rose">{(apply.error as Error).message}</p>}
        </Card>
      )}

      <Card title="History">
        {loans.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
          (loans.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No applications yet.</p> :
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">Ref</th><th className="px-3 py-2">Purpose</th>
                  <th className="px-3 py-2">Amount</th><th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(loans.data ?? []).map((l) => {
                  const Icon = ICON[l.status] ?? Clock;
                  return (
                    <tr key={l.id} className="hover:bg-surface-elevated/40">
                      <td className="px-3 py-3 font-mono text-xs">{String(l.id).slice(0, 8)}</td>
                      <td className="px-3 py-3">{l.purpose ?? "—"}</td>
                      <td className="px-3 py-3 font-semibold">KES {Number(l.amount_kes).toLocaleString()}</td>
                      <td className="px-3 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</td>
                      <td className="px-3 py-3"><span className="inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" /><Tag label={l.status} tone={TONE[l.status] ?? "sky"} /></span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        }
      </Card>
    </div>
  );
}
