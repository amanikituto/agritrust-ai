import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Plus } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { addFarmRecord, listMyFarmRecords, RECORD_TYPES, type RecordType } from "@/lib/farm-records.functions";
import { computeMyTrustScore } from "@/lib/trust-score.functions";

export const Route = createFileRoute("/farmer/records")({
  component: RecordsPage,
});

const LABEL: Record<RecordType, string> = {
  planting: "Planting", harvest: "Harvest", input_purchase: "Input purchase",
  sale: "Produce sale", repayment: "Loan repayment", training: "Training attended",
  extension_visit: "Extension visit", coop_meeting: "Cooperative meeting",
  weather_damage: "Weather damage", pest_outbreak: "Pest outbreak",
  insurance: "Insurance purchase", savings_deposit: "Savings deposit", equipment: "Equipment purchase",
};

function RecordsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyFarmRecords);
  const addFn = useServerFn(addFarmRecord);
  const scoreFn = useServerFn(computeMyTrustScore);
  const list = useQuery({ queryKey: ["farm-records"], queryFn: () => listFn() });

  const [type, setType] = useState<RecordType>("harvest");
  const [amount, setAmount] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [notes, setNotes] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      await addFn({ data: {
        record_type: type,
        amount_kes: amount === "" ? undefined : Number(amount),
        counterparty: counterparty || undefined,
        notes: notes || undefined,
      } });
      await scoreFn();
    },
    onSuccess: () => {
      setAmount(""); setCounterparty(""); setNotes("");
      qc.invalidateQueries({ queryKey: ["farm-records"] });
      qc.invalidateQueries({ queryKey: ["me", "trust"] });
    },
  });

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Trust Signals" title="Record Updates"
        sub="Every update strengthens your Digital Trust Profile and refreshes your score." />

      <Card title="Add an update" icon={Plus}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as RecordType)}
              className="h-10 rounded-md border border-border bg-surface-elevated/60 px-3 text-sm">
              {RECORD_TYPES.map((t) => <option key={t} value={t}>{LABEL[t]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Amount (KES)</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="h-10 rounded-md border border-border bg-surface-elevated/60 px-3 text-sm" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Counterparty</span>
            <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)}
              placeholder="Buyer, supplier, trainer…"
              className="h-10 rounded-md border border-border bg-surface-elevated/60 px-3 text-sm" />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Notes</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="rounded-md border border-border bg-surface-elevated/60 p-3 text-sm" />
          </label>
        </div>
        <div className="mt-4">
          <button disabled={add.isPending} onClick={() => add.mutate()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            <Plus className="h-4 w-4" /> {add.isPending ? "Saving & re-scoring…" : "Save update"}
          </button>
          {add.error && <span className="ml-3 text-xs text-rose">{(add.error as Error).message}</span>}
        </div>
      </Card>

      <Card title={`Recent updates · ${list.data?.length ?? 0}`} icon={Calendar}>
        {list.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
          (list.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No updates yet — add your first above.</p> :
          <ul className="divide-y divide-border/40">
            {(list.data ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <Tag label={LABEL[r.record_type as RecordType] ?? r.record_type} tone="emerald" />
                  <span className="text-muted-foreground">{r.occurred_on}</span>
                  {r.counterparty && <span>· {r.counterparty}</span>}
                </div>
                <div className="font-mono text-xs">{r.amount_kes ? `KES ${Number(r.amount_kes).toLocaleString()}` : "—"}</div>
              </li>
            ))}
          </ul>
        }
      </Card>
    </div>
  );
}
