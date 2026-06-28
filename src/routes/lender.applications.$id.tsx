import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  BadgeCheck,
  Brain,
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  Receipt,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react";
import { Card, Gauge, KpiCard, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { getApplication, decideApplication } from "@/lib/loans.functions";
import {
  getExistingAgentJob,
  lenderRequestFarmerProfile,
  listAgentInfo,
} from "@/lib/agent.functions";

type Tier = "basic" | "standard" | "premium";

// Fallback Masumi pricing — mirrors src/lib/masumi.server.ts so the paywall
// always shows correct KES amounts even if listAgentInfo() is still loading.
const FALLBACK_PRICING: Record<Tier, number> = { basic: 50, standard: 150, premium: 400 };

interface AgritrustProfile {
  farmer_id: string;
  tier: Tier;
  masumi_trust_score: number;
  components: { mobile_money: number; coop: number; repayment: number; farm_data: number };
  climate_penalty: number;
  recommendation: "approve" | "review" | "decline";
  identity?: { name: string; county: string | null };
  farm?: { size_acres: number | null; crops: string[]; cooperative: string | null };
  graph_signals?: { degree: number; coop_members: number; source: "neo4j" | "fallback" };
  generated_at: string;
}


export const Route = createFileRoute("/lender/applications/$id")({
  component: DecisionWorkspace,
});



interface PurchaseResult {
  profile: AgritrustProfile;
  invocation: { jobId: string; escrowTx: string; explorerUrl: string; isMocked: boolean; amountKes: number };
  climate: { tx: string; explorerUrl: string; isMocked: boolean };
  signature: string;
}

function DecisionWorkspace() {
  const { id } = useParams({ from: "/lender/applications/$id" });
  const qc = useQueryClient();
  const getFn = useServerFn(getApplication);
  const decideFn = useServerFn(decideApplication);
  const infoFn = useServerFn(listAgentInfo);
  const existingFn = useServerFn(getExistingAgentJob);
  const invokeFn = useServerFn(lenderRequestFarmerProfile);

  const app = useQuery({ queryKey: ["app", id], queryFn: () => getFn({ data: { id } }) });
  const info = useQuery({ queryKey: ["agent", "info"], queryFn: () => infoFn() });

  const farmerId = app.data?.farmer_id ?? "";
  const existing = useQuery({
    queryKey: ["agent", "existing", farmerId],
    queryFn: () => existingFn({ data: { farmerId } }),
    enabled: !!farmerId,
  });

  const [tier, setTier] = useState<Tier>("standard");
  const [notes, setNotes] = useState("");
  const [unlocked, setUnlocked] = useState<PurchaseResult | null>(null);

  // Hydrate from cached purchase
  useEffect(() => {
    if (!unlocked && existing.data?.result) {
      setUnlocked({
        profile: existing.data.result as unknown as AgritrustProfile,
        invocation: {
          jobId: existing.data.masumi_job_id ?? "",
          escrowTx: existing.data.escrow_tx ?? "",
          explorerUrl: existing.data.explorer_url ?? "",
          isMocked: !!existing.data.is_mocked,
          amountKes: Number(existing.data.amount_kes ?? 0),
        },
        climate: {
          tx: existing.data.outbound_tx ?? "",
          explorerUrl: existing.data.outbound_explorer_url ?? "",
          isMocked: !!existing.data.is_mocked,
        },
        signature: "",
      });
    }
  }, [existing.data, unlocked]);

  const buy = useMutation({
    mutationFn: () => invokeFn({ data: { farmerId, tier } }),
    onSuccess: (r) => {
      setUnlocked(r as unknown as PurchaseResult);
      qc.invalidateQueries({ queryKey: ["agent", "existing", farmerId] });
      qc.invalidateQueries({ queryKey: ["agent", "jobs"] });
    },
  });

  const decide = useMutation({
    mutationFn: (decision: "approved" | "approved_with_conditions" | "needs_info" | "rejected" | "under_review") =>
      decideFn({ data: { id, decision, notes } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["app", id] });
      qc.invalidateQueries({ queryKey: ["lender", "applications"] });
    },
  });

  const price = info.data?.pricing[tier] ?? FALLBACK_PRICING[tier];
  const isUnlocked = !!unlocked;
  const wasCached = isUnlocked && !buy.data && !!existing.data;

  const positiveFactors = useMemo(() => app.data?.top_positive_factors ?? [], [app.data]);
  const negativeFactors = useMemo(() => app.data?.top_negative_factors ?? [], [app.data]);

  if (app.isLoading) return <p className="p-10 text-muted-foreground">Loading…</p>;
  if (!app.data) return <p className="p-10 text-muted-foreground">Application not found.</p>;
  const a = app.data;

  return (
    <div className="space-y-8">
      <Link to="/lender/applications" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to queue
      </Link>

      <SectionTitle
        eyebrow="Decision workspace"
        title={`Application · ${a.profile?.full_name ?? "Farmer"}`}
        sub={`${a.farmer?.cooperative ?? "—"} · ${a.farmer?.county ?? "—"} · ${(a.farmer?.crops ?? []).join(", ") || "—"}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Requested" value={`KES ${Number(a.amount_kes).toLocaleString()}`} tone="sky" icon={ShieldCheck} />
        <KpiCard label="Term" value={`${a.term_months} months`} tone="emerald" icon={Clock} />
        <KpiCard label="Climate risk" value={a.climate_risk_snapshot ?? "—"} tone={a.climate_risk_snapshot === "low" ? "emerald" : a.climate_risk_snapshot === "high" ? "rose" : "gold"} icon={ShieldCheck} />
        <KpiCard label="Snapshot AI rec" value={a.ai_recommendation ?? "—"} tone={a.ai_recommendation === "approve" ? "emerald" : a.ai_recommendation === "decline" ? "rose" : "sky"} icon={Brain} />
      </div>

      {!isUnlocked ? (
        <Card
          title="Credit profile locked"
          icon={Lock}
          action={<Tag label="Masumi escrow" tone="gold" />}
        >
          <p className="text-sm text-muted-foreground">
            Your Lender Agent will discover the AgriTrust Agent through the Masumi registry, open
            an ADA escrow, and pay for a signed credit profile. The AgriTrust Agent then queries
            the Neo4j graph and Supabase, returns the scored payload, and pays an outbound Climate
            Agent. Nothing is hardcoded — discovery and invocation flow through Masumi.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {(["basic", "standard", "premium"] as const).map((t) => {
              const p = info.data?.pricing[t] ?? FALLBACK_PRICING[t];
              const active = tier === t;
              const labels: Record<Tier, string> = {
                basic: "Score + recommendation",
                standard: "+ identity & farm summary",
                premium: "+ Neo4j relationship signals",
              };
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className={`text-left rounded-xl border p-4 transition ${active ? "border-emerald bg-emerald/10" : "border-border/60 bg-surface-elevated/40 hover:bg-surface-elevated/70"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{t}</span>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2 text-lg font-semibold">KES {p}</div>
                  <div className="text-xs text-muted-foreground">{labels[t]}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              disabled={!farmerId || buy.isPending}
              onClick={() => buy.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" /> {buy.isPending ? "Paying via Masumi…" : `Pay KES ${price} & unlock`}
            </button>
            <span className="text-xs text-muted-foreground">Escrow on Cardano {info.data?.agent.network ?? "preprod"} · Lender Agent → AgriTrust Agent</span>
          </div>
          {buy.isError && (
            <p className="mt-3 text-sm text-rose">{(buy.error as Error).message}</p>
          )}
        </Card>
      ) : (
        <UnlockedProfile result={unlocked!} wasCached={wasCached} positiveFactors={positiveFactors} negativeFactors={negativeFactors} climateRisk={a.climate_risk_snapshot} />
      )}

      <Card title="Decision" icon={CheckCircle2}>
        {!isUnlocked && (
          <div className="mb-4 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs text-gold">
            Unlock the credit profile above before recording a decision.
          </div>
        )}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Reviewer notes (optional)"
          className="mb-4 w-full rounded-md border border-border/60 bg-surface-elevated/60 p-3 text-sm"
          rows={3}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {([
            { l: "Approve", d: "approved" as const, Icon: CheckCircle2 },
            { l: "Approve w/ conditions", d: "approved_with_conditions" as const, Icon: ShieldCheck },
            { l: "Request info", d: "needs_info" as const, Icon: Brain },
            { l: "Manual review", d: "under_review" as const, Icon: Brain },
            { l: "Reject", d: "rejected" as const, Icon: XCircle },
          ]).map(({ l, d, Icon }) => (
            <button
              key={l}
              disabled={decide.isPending || !isUnlocked}
              onClick={() => decide.mutate(d)}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/40 bg-surface-elevated/60 px-3 py-3 text-xs font-semibold transition hover:bg-surface-elevated disabled:opacity-50"
            >
              <Icon className="h-4 w-4" /> {l}
            </button>
          ))}
        </div>
        {decide.data && (
          <div className="mt-4 rounded-xl bg-emerald/10 p-3 text-sm text-emerald">
            Status updated to <strong>{decide.data.status.replaceAll("_", " ")}</strong>. Farmer notified.
          </div>
        )}
        {decide.error && <p className="mt-2 text-xs text-rose">{(decide.error as Error).message}</p>}
      </Card>
    </div>
  );
}

function UnlockedProfile({
  result,
  wasCached,
  positiveFactors,
  negativeFactors,
  climateRisk,
}: {
  result: PurchaseResult;
  wasCached: boolean;
  positiveFactors: string[];
  negativeFactors: string[];
  climateRisk: string | null;
}) {
  const { profile, invocation, climate, signature } = result;
  const score100 = profile.masumi_trust_score; // 0-100
  const score850 = Math.round((score100 / 100) * 850);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card
          title="Credit profile · unlocked"
          icon={BadgeCheck}
          action={
            <Tag
              label={wasCached ? "Previously purchased" : invocation.isMocked ? "MOCKED escrow" : "LIVE escrow"}
              tone={wasCached ? "sky" : invocation.isMocked ? "gold" : "emerald"}
            />
          }
        >
          <div className="flex flex-col items-center py-2">
            <Gauge score={score850} />
            <div className="text-xs text-muted-foreground mt-1">Masumi score: {score100}/100</div>
            <Tag
              label={profile.recommendation.toUpperCase()}
              tone={profile.recommendation === "approve" ? "emerald" : profile.recommendation === "decline" ? "rose" : "gold"}
            />
          </div>
        </Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <KpiCard label="Mobile money" value={`${profile.components.mobile_money}/100`} tone="sky" icon={Wallet} />
          <KpiCard label="Cooperative" value={`${profile.components.coop}/100`} tone="emerald" icon={ShieldCheck} />
          <KpiCard label="Repayment" value={`${profile.components.repayment}/100`} tone="gold" icon={Receipt} />
          <KpiCard label="Farm data" value={`${profile.components.farm_data}/100`} tone="sky" icon={Brain} />
        </div>
      </div>

      {profile.identity && (
        <Card title="Identity & farm" icon={ShieldCheck}>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Name</div>
              <div className="font-medium">{profile.identity.name}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">County</div>
              <div className="font-medium">{profile.identity.county ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Cooperative</div>
              <div className="font-medium">{profile.farm?.cooperative ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Farm size</div>
              <div className="font-medium">{profile.farm?.size_acres ? `${profile.farm.size_acres} acres` : "—"}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs uppercase text-muted-foreground">Crops</div>
              <div className="font-medium">{(profile.farm?.crops ?? []).join(", ") || "—"}</div>
            </div>
          </div>
        </Card>
      )}

      {profile.graph_signals && (
        <Card title="Neo4j relationship signals" icon={Sparkles} action={<Tag label={profile.graph_signals.source} tone={profile.graph_signals.source === "neo4j" ? "emerald" : "gold"} />}>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <KpiCard label="Graph degree" value={String(profile.graph_signals.degree)} tone="sky" icon={Sparkles} />
            <KpiCard label="Cooperative peers" value={String(profile.graph_signals.coop_members)} tone="emerald" icon={Sparkles} />
          </div>
        </Card>
      )}

      <Card title="Application factors" icon={Brain}>
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald">Positive</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {positiveFactors.map((f) => <li key={f}>+ {f}</li>)}
              {positiveFactors.length === 0 && <li>—</li>}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-rose">Negative</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {negativeFactors.map((f) => <li key={f}>− {f}</li>)}
              {negativeFactors.length === 0 && <li>—</li>}
            </ul>
          </div>
        </div>
        {climateRisk && (
          <div className="mt-3 text-xs text-muted-foreground">
            Climate risk snapshot at application time: <strong>{climateRisk}</strong>
          </div>
        )}
      </Card>

      <Card title="Masumi audit trail" icon={Receipt}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-surface-elevated/60 p-3 text-sm">
            <div className="text-xs uppercase text-muted-foreground">Lender Agent → AgriTrust escrow</div>
            <div className="font-mono text-xs truncate">{invocation.escrowTx || "—"}</div>
            {invocation.explorerUrl && (
              <a href={invocation.explorerUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-emerald hover:underline">
                View on Cardanoscan <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <div className="mt-1 text-xs text-muted-foreground">Job: <span className="font-mono">{invocation.jobId || "—"}</span></div>
          </div>
          <div className="rounded-xl bg-surface-elevated/60 p-3 text-sm">
            <div className="text-xs uppercase text-muted-foreground">AgriTrust → Climate Agent (outbound)</div>
            <div className="font-mono text-xs truncate">{climate.tx || "—"}</div>
            {climate.explorerUrl && (
              <a href={climate.explorerUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-emerald hover:underline">
                View on Cardanoscan <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        {signature && (
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5" /> Signed receipt: <span className="font-mono truncate">{signature.slice(0, 48)}…</span>
          </div>
        )}
      </Card>
    </>
  );
}
