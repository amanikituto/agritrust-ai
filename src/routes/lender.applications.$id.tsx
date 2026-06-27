import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Brain, CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { Card, Gauge, KpiCard, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { getApplication, decideApplication } from "@/lib/loans.functions";

export const Route = createFileRoute("/lender/applications/$id")({
  component: DecisionWorkspace,
});

function DecisionWorkspace() {
  const { id } = useParams({ from: "/lender/applications/$id" });
  const qc = useQueryClient();
  const getFn = useServerFn(getApplication);
  const decideFn = useServerFn(decideApplication);
  const app = useQuery({ queryKey: ["app", id], queryFn: () => getFn({ data: { id } }) });
  const [notes, setNotes] = useState("");

  const decide = useMutation({
    mutationFn: (decision: "approved" | "rejected" | "under_review") =>
      decideFn({ data: { id, decision, notes } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["app", id] }); qc.invalidateQueries({ queryKey: ["lender", "applications"] }); },
  });

  if (app.isLoading) return <p className="p-10 text-muted-foreground">Loading…</p>;
  if (!app.data) return <p className="p-10 text-muted-foreground">Application not found.</p>;
  const a = app.data;

  return (
    <div className="space-y-8">
      <Link to="/lender/applications" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to queue
      </Link>

      <SectionTitle eyebrow="Decision workspace"
        title={`Application · ${a.profile?.full_name ?? "Farmer"}`}
        sub={`${a.farmer?.cooperative ?? "—"} · ${a.farmer?.county ?? "—"} · ${(a.farmer?.crops ?? []).join(", ") || "—"}`} />

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card title="Trust Score" icon={ShieldCheck}>
          <div className="flex flex-col items-center py-2">
            <Gauge score={a.trust_score_snapshot ?? 0} />
            <Tag label={a.ai_confidence ? `${(a.ai_confidence * 100).toFixed(0)}% confidence` : "n/a"} tone="emerald" />
          </div>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard label="Requested" value={`KES ${Number(a.amount_kes).toLocaleString()}`} tone="sky" icon={ShieldCheck} />
          <KpiCard label="Term" value={`${a.term_months} months`} tone="emerald" icon={Clock} />
          <KpiCard label="Climate risk" value={a.climate_risk_snapshot ?? "—"} tone={a.climate_risk_snapshot === "low" ? "emerald" : a.climate_risk_snapshot === "high" ? "rose" : "gold"} icon={ShieldCheck} />
          <KpiCard label="AI recommendation" value={a.ai_recommendation ?? "—"} tone={a.ai_recommendation === "approve" ? "emerald" : a.ai_recommendation === "decline" ? "rose" : "sky"} icon={Brain} />
        </div>
      </div>

      <Card title="Factors" icon={Brain}>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald">Positive</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {(a.top_positive_factors ?? []).map((f) => <li key={f}>+ {f}</li>)}
              {(a.top_positive_factors ?? []).length === 0 && <li>—</li>}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-rose">Negative</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {(a.top_negative_factors ?? []).map((f) => <li key={f}>− {f}</li>)}
              {(a.top_negative_factors ?? []).length === 0 && <li>—</li>}
            </ul>
          </div>
        </div>
      </Card>

      <Card title="Decision">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reviewer notes (optional)"
          className="mb-4 w-full rounded-md border border-border/60 bg-surface-elevated/60 p-3 text-sm" rows={3} />
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            { l: "Approve", d: "approved", t: "emerald" as const, Icon: CheckCircle2 },
            { l: "Manual review", d: "under_review", t: "sky" as const, Icon: Brain },
            { l: "Reject", d: "rejected", t: "rose" as const, Icon: XCircle },
          ] as const).map(({ l, d, Icon }) => (
            <button key={l} disabled={decide.isPending} onClick={() => decide.mutate(d)}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-surface-elevated/60 px-4 py-3 text-sm font-semibold transition hover:bg-surface-elevated disabled:opacity-50">
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </div>
        {decide.data && (
          <div className="mt-4 rounded-xl bg-emerald/10 p-3 text-sm text-emerald">
            Status updated to <strong>{decide.data.status}</strong>. Farmer notified.
          </div>
        )}
        {decide.error && <p className="mt-2 text-xs text-rose">{(decide.error as Error).message}</p>}
      </Card>
    </div>
  );
}
