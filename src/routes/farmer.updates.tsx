import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { ArrowRight, Loader2, TrendingUp } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { addFarmRecordPublic } from "@/lib/operations.functions";
import { getFarmerById, listFarmers } from "@/lib/farmers.functions";

const RECORDS = [
  { key: "planting", label: "Planting" },
  { key: "harvest", label: "Harvest" },
  { key: "input_purchase", label: "Input purchase" },
  { key: "sale", label: "Produce sale" },
  { key: "repayment", label: "Loan repayment" },
  { key: "savings_deposit", label: "Savings contribution" },
  { key: "coop_meeting", label: "Cooperative meeting" },
  { key: "training", label: "Training attended" },
  { key: "extension_visit", label: "Extension visit" },
  { key: "pest_outbreak", label: "Pest outbreak" },
  { key: "weather_damage", label: "Weather damage" },
  { key: "insurance", label: "Insurance purchase" },
] as const;

export const Route = createFileRoute("/farmer/updates")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({ meta: [{ title: "Update Records · AgriTrust AI" }] }),
  component: Updates,
});

function Updates() {
  const search = Route.useSearch();
  const qc = useQueryClient();
  const farmersQ = useQuery({ queryKey: ["farmers"], queryFn: () => listFarmers() });
  const [farmerId, setFarmerId] = useState(search.id ?? "");
  const [type, setType] = useState<string>("sale");
  const [amount, setAmount] = useState<string>("");
  const [counterparty, setCounterparty] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{ delta: number; after: number } | null>(null);

  const farmerQ = useQuery({
    queryKey: ["farmer", farmerId],
    queryFn: () => getFarmerById({ data: { id: farmerId } }),
    enabled: !!farmerId,
  });

  const mut = useMutation({
    mutationFn: () => addFarmRecordPublic({
      data: {
        farmerId, record_type: type,
        amount_kes: amount ? Number(amount) : undefined,
        counterparty: counterparty || undefined,
        notes: notes || undefined,
      },
    }),
    onSuccess: (r) => {
      setResult({ delta: r.delta, after: r.scoreAfter });
      setAmount(""); setCounterparty(""); setNotes("");
      qc.invalidateQueries({ queryKey: ["farmer", farmerId] });
    },
  });

  return (
    <div className="min-h-dvh">
      <SiteHeader variant="app" />
      <main className="container-page py-10">
        <h1 className="font-display text-3xl font-bold text-leaf">Update Farm Records</h1>
        <p className="mt-1 text-sm text-charcoal/70">Every update builds a stronger Trust Score.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="card-soft p-6 lg:col-span-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-charcoal/80">Farmer</span>
              <select className="field" value={farmerId} onChange={(e) => setFarmerId(e.target.value)}>
                <option value="">Select farmer…</option>
                {(farmersQ.data ?? []).map((f) => <option key={f.id} value={f.id}>{f.name} · {f.county}</option>)}
              </select>
            </label>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-charcoal/80">Record type</span>
                <select className="field" value={type} onChange={(e) => setType(e.target.value)}>
                  {RECORDS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-charcoal/80">Amount (KES)</span>
                <input type="number" className="field" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-charcoal/80">Counterparty / partner</span>
                <input className="field" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Buyer, cooperative, trainer…" />
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="mb-1 block font-medium text-charcoal/80">Notes</span>
                <textarea rows={2} className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
            </div>

            <button className="btn-primary mt-6" disabled={!farmerId || mut.isPending} onClick={() => mut.mutate()}>
              {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Save & Recalculate <ArrowRight className="h-4 w-4" /></>}
            </button>

            {result && (
              <div className="mt-4 rounded-lg border border-leaf bg-leaf-soft/40 p-4 text-sm">
                Record submitted. Trust Score is now <strong>{result.after}/100</strong>
                {result.delta !== 0 && <> ({result.delta > 0 ? "+" : ""}{result.delta} pts)</>}.
              </div>
            )}
            {mut.isError && <p className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{(mut.error as Error).message}</p>}
          </div>

          <div className="card-soft p-6">
            <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-leaf" /><h2 className="font-display font-bold">Recent records</h2></div>
            <ul className="mt-4 space-y-3 text-sm">
              {(farmerQ.data?.records ?? []).slice(0, 8).map((r) => (
                <li key={r.id} className="flex items-start justify-between border-b border-border/60 pb-2 last:border-0">
                  <div>
                    <div className="font-medium capitalize">{r.record_type.replaceAll("_", " ")}</div>
                    <div className="text-xs text-charcoal/60">{r.occurred_on} {r.counterparty ? `· ${r.counterparty}` : ""}</div>
                  </div>
                  {r.amount_kes != null && <div className="text-sm font-semibold text-leaf">KES {Number(r.amount_kes).toLocaleString()}</div>}
                </li>
              ))}
              {farmerQ.data && (farmerQ.data.records ?? []).length === 0 && (
                <li className="text-charcoal/60">No records yet — submit the first above.</li>
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
