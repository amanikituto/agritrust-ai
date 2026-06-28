import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, FileQuestion, Loader2, Network, Sprout, X } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { TrustGauge, riskMeta } from "@/components/TrustGauge";
import { getFarmerById } from "@/lib/farmers.functions";
import { submitLoanPublic, decideLoanPublic, getLoanWithFarmer } from "@/lib/operations.functions";

export const Route = createFileRoute("/lender/farmer/$id")({
  head: () => ({ meta: [{ title: "Loan Review · AgriTrust AI" }] }),
  component: Review,
});

function Review() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  // The :id can be either a farmer id or a loan application id — try loan first.
  const loanQ = useQuery({
    queryKey: ["loan-with-farmer", id],
    queryFn: () => getLoanWithFarmer({ data: { id } }),
    retry: false,
  });
  const loan = loanQ.data?.app ?? null;
  const farmerId = loan?.farmer_id ?? id;

  const farmerQ = useQuery({
    queryKey: ["farmer", farmerId],
    queryFn: () => getFarmerById({ data: { id: farmerId } }),
    enabled: !!farmerId,
  });

  const [notes, setNotes] = useState("");

  const decideMut = useMutation({
    mutationFn: (decision: "approved" | "approved_with_conditions" | "needs_info" | "rejected") =>
      decideLoanPublic({ data: { id: loan!.id, decision, notes: notes || undefined } }),
    onSuccess: () => navigate({ to: "/lender" }),
  });

  const submitMut = useMutation({
    mutationFn: (input: { amount: number; term: number; purpose: string }) =>
      submitLoanPublic({ data: { farmerId, amount_kes: input.amount, term_months: input.term, purpose: input.purpose, source: "web" } }),
    onSuccess: () => loanQ.refetch(),
  });

  if (farmerQ.isLoading) return <div className="min-h-dvh"><SiteHeader variant="app" /><div className="container-page py-20 text-center">Loading…</div></div>;
  const data = farmerQ.data;
  if (!data) return <div className="min-h-dvh"><SiteHeader variant="app" /><div className="container-page py-20 text-center">Farmer not found.</div></div>;

  const { profile, farmer, trust } = data;
  const score = trust?.score ?? 50;
  const r = riskMeta(score);
  const components = (trust?.components ?? {}) as Record<string, number>;
  const positives = (trust?.top_positive_factors ?? []) as string[];
  const negatives = (trust?.top_negative_factors ?? []) as string[];
  const narrative = (trust?.components as { narrative?: string } | null)?.narrative ?? "Score not yet generated.";

  return (
    <div className="min-h-dvh">
      <SiteHeader variant="app" />
      <main className="container-page py-8">
        <Link to="/lender" className="btn-ghost mb-4"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-leaf">{profile?.full_name ?? "Farmer"}</h1>
            <p className="text-sm text-charcoal/70">{farmer?.county} · {(farmer?.crops ?? []).join(", ") || "—"}</p>
          </div>
          <Link to="/graph/$farmerId" params={{ farmerId }} className="btn-secondary"><Network className="h-4 w-4" /> Graph</Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card-soft p-6">
            <div className="text-xs uppercase tracking-wider text-charcoal/60">Trust Score</div>
            <div className="mt-3 grid place-items-center"><TrustGauge score={score} size={170} /></div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-lg bg-muted p-2"><div className="text-charcoal/60">Credit Readiness</div><div className="font-bold text-leaf">{trust?.credit_readiness ?? 0}%</div></div>
              <div className="rounded-lg bg-muted p-2"><div className="text-charcoal/60">Climate Risk</div><div className="font-bold capitalize">{trust?.climate_risk ?? "—"}</div></div>
              <div className="rounded-lg bg-muted p-2 col-span-2"><div className="text-charcoal/60">Recommended limit</div><div className="font-bold text-leaf">KES {(trust?.loan_eligibility_kes ?? 0).toLocaleString()}</div></div>
            </div>
          </div>

          <div className="card-soft p-6 lg:col-span-2">
            <h3 className="font-display font-bold">Trust Score Breakdown</h3>
            <div className="mt-4 space-y-2">
              {Object.entries(componentWeights).map(([k, w]) => {
                const v = Math.round(components[k] ?? 0);
                return (
                  <div key={k} className="flex items-center gap-3 text-sm">
                    <div className="w-44 capitalize text-charcoal/70">{k.replaceAll("_"," ")} <span className="text-xs text-charcoal/40">({w}pt)</span></div>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-leaf" style={{ width: `${v}%` }} />
                    </div>
                    <div className="w-10 text-right font-semibold">{v}</div>
                  </div>
                );
              })}
            </div>
            <p className="mt-5 rounded-lg bg-cream p-4 text-sm leading-relaxed">{narrative}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card-soft p-6">
            <h3 className="font-display font-bold">Positive signals</h3>
            <ul className="mt-3 space-y-1.5 text-sm">{positives.length ? positives.map((p) => <li key={p}>✅ {p}</li>) : <li className="text-charcoal/60">None recorded yet.</li>}</ul>
            <h3 className="mt-5 font-display font-bold text-danger">Risk signals</h3>
            <ul className="mt-3 space-y-1.5 text-sm">{negatives.length ? negatives.map((n) => <li key={n}>⚠️ {n}</li>) : <li className="text-charcoal/60">No major risks detected.</li>}</ul>
          </div>

          <div className="card-soft p-6">
            <h3 className="font-display font-bold">Loan Request</h3>
            {loan ? (
              <>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="rounded-lg bg-muted p-3"><div className="text-charcoal/60">Amount</div><div className="font-bold text-leaf">KES {Number(loan.amount_kes).toLocaleString()}</div></div>
                  <div className="rounded-lg bg-muted p-3"><div className="text-charcoal/60">Term</div><div className="font-bold">{loan.term_months}m</div></div>
                  <div className="rounded-lg bg-muted p-3"><div className="text-charcoal/60">Source</div><div className="font-bold capitalize">{loan.source ?? "web"}</div></div>
                </div>
                <div className="mt-4 rounded-lg border border-leaf-soft bg-leaf-soft/30 p-3 text-sm">
                  <strong className="text-leaf">AI Recommendation:</strong> <span className="capitalize">{loan.ai_recommendation?.replaceAll("_"," ") ?? "review"}</span>
                </div>
              </>
            ) : (
              <NewLoanForm submitting={submitMut.isPending} onSubmit={(v) => submitMut.mutate(v)} />
            )}
          </div>
        </div>

        {loan && (
          <div className="card-soft mt-6 p-6">
            <h3 className="font-display font-bold">Decision</h3>
            <textarea rows={3} className="field mt-3" placeholder="Decision notes / conditions…"
              value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => decideMut.mutate("approved")} disabled={decideMut.isPending} className="btn-primary"><Check className="h-4 w-4" /> Approve</button>
              <button onClick={() => decideMut.mutate("approved_with_conditions")} disabled={decideMut.isPending} className="btn-secondary"><Check className="h-4 w-4" /> Approve with Conditions</button>
              <button onClick={() => decideMut.mutate("needs_info")} disabled={decideMut.isPending} className="btn-ghost text-earth"><FileQuestion className="h-4 w-4" /> Request More Info</button>
              <button onClick={() => decideMut.mutate("rejected")} disabled={decideMut.isPending} className="btn-ghost text-danger"><X className="h-4 w-4" /> Reject</button>
              {decideMut.isPending && <Loader2 className="h-5 w-5 animate-spin text-leaf" />}
            </div>
            <div className="mt-3 text-xs text-charcoal/60">
              Current status: <span className="capitalize">{loan.status.replaceAll("_"," ")}</span> · Risk band: <span style={{ color: r.color }}>{r.label}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const componentWeights = {
  repayment: 25, cooperative: 15, farm_records: 15, mobile_money: 10,
  savings: 10, input_purchases: 10, training: 5, climate_resilience: 5, insurance: 5,
};

function NewLoanForm({ onSubmit, submitting }: { onSubmit: (v: { amount: number; term: number; purpose: string }) => void; submitting: boolean }) {
  const [amount, setAmount] = useState(30000);
  const [term, setTerm] = useState(6);
  const [purpose, setPurpose] = useState("seeds");
  return (
    <div className="mt-3 space-y-3 text-sm">
      <p className="text-charcoal/70">No application yet. Submit one on the farmer's behalf:</p>
      <div className="grid grid-cols-3 gap-3">
        <label><span className="text-xs text-charcoal/60">Amount (KES)</span><input type="number" className="field" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label>
        <label><span className="text-xs text-charcoal/60">Term (m)</span><input type="number" className="field" value={term} onChange={(e) => setTerm(Number(e.target.value))} /></label>
        <label><span className="text-xs text-charcoal/60">Purpose</span>
          <select className="field" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option>seeds</option><option>equipment</option><option>livestock</option><option>other</option>
          </select>
        </label>
      </div>
      <button onClick={() => onSubmit({ amount, term, purpose })} disabled={submitting} className="btn-primary">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sprout className="h-4 w-4" /> Submit Application</>}
      </button>
    </div>
  );
}
