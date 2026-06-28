import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  BadgeCheck,
  Brain,
  Bug,
  CheckCircle2,
  CloudRain,
  Mail,
  MapPin,
  Phone,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sprout,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import {
  Bars,
  Card,
  Gauge,
  KpiCard,
  NetworkGraph,
  SectionTitle,
  ShapBars,
  Sparkline,
  Tag,
} from "@/components/dashboard/primitives";
import { getFarmerDetail } from "@/lib/farmer-data.functions";
import { getNetworkGraph } from "@/lib/graph.functions";
import { decideApplication } from "@/lib/loans.functions";

export const Route = createFileRoute("/lender/farmers/$id")({
  component: FarmerProfile,
});

type Decision = "approved" | "approved_with_conditions" | "needs_info" | "rejected";

function FarmerProfile() {
  const { id } = useParams({ from: "/lender/farmers/$id" });
  const qc = useQueryClient();
  const getFn = useServerFn(getFarmerDetail);
  const graphFn = useServerFn(getNetworkGraph);
  const decideFn = useServerFn(decideApplication);
  const detail = useQuery({ queryKey: ["lender", "farmer", id], queryFn: () => getFn({ data: { id } }) });
  const graph = useQuery({ queryKey: ["graph", "farmer", id], queryFn: () => graphFn({ data: { centerId: id } }) });

  const [notes, setNotes] = useState("");

  const openLoan = useMemo(() => {
    const loans = detail.data?.loans ?? [];
    return loans.find((l) => ["submitted", "under_review", "needs_info"].includes(l.status)) ?? loans[0];
  }, [detail.data]);

  const decide = useMutation({
    mutationFn: (d: Decision) => decideFn({ data: { id: openLoan!.id, decision: d, notes } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lender", "farmer", id] });
      qc.invalidateQueries({ queryKey: ["lender", "applications"] });
    },
  });

  if (detail.isLoading) return <p className="p-10 text-muted-foreground">Loading farmer profile…</p>;
  if (!detail.data?.farmer && !detail.data?.profile) return <div className="p-10 text-center text-muted-foreground">Farmer not found.</div>;

  const farmer = detail.data.farmer;
  const profile = detail.data.profile;
  const trust = detail.data.trust;
  const loans = detail.data.loans ?? [];
  const records = detail.data.records ?? [];

  const comp = (trust?.components ?? {}) as Record<string, number | string | Record<string, number>>;
  const get = (k: string) => Math.round(Number(comp[k] ?? 0));
  const repayment = get("repayment");
  const cooperative = get("cooperative");
  const production = get("production");
  const mobileMoney = get("mobile_money");
  const climateResilience = get("climate_resilience");

  const score = trust?.score ?? 0;
  const riskLevel = score >= 75 ? "Low" : score >= 55 ? "Medium" : "High";
  const recommendation = score >= 75 ? "approve" : score >= 55 ? "review" : "decline";
  const recommendedAmount = trust?.loan_eligibility_kes ?? Math.round(score * 1500);
  const recommendedTerm = score >= 75 ? 12 : score >= 55 ? 9 : 6;

  const repaid = loans.filter((l) => l.status === "repaid").length;
  const active = loans.filter((l) => ["approved", "disbursed"].includes(l.status)).length;
  const totalApproved = loans.filter((l) => ["approved", "disbursed", "repaid"].includes(l.status)).reduce((s, l) => s + Number(l.amount_kes ?? 0), 0);
  const history = detail.data.trustHistory?.length ? detail.data.trustHistory.map((h) => h.score) : [score];

  const positives = trust?.top_positive_factors ?? [];
  const negatives = trust?.top_negative_factors ?? [];
  const recommendations = trust?.recommendations ?? [];
  const narrative = (typeof comp.narrative === "string" ? comp.narrative : null) ??
    `Composite trust ${score}/100. AI recommendation: ${recommendation}.`;

  const pestEvents = records.filter((r) => r.record_type === "pest_outbreak").length;
  const weatherEvents = records.filter((r) => r.record_type === "weather_damage").length;
  const pestRisk = pestEvents + weatherEvents >= 3 ? "High" : pestEvents + weatherEvents >= 1 ? "Medium" : "Low";

  const harvestRecords = records.filter((r) => r.record_type === "harvest").length;
  const saleRecords = records.filter((r) => r.record_type === "sale").length;
  const repayRecords = records.filter((r) => r.record_type === "repayment").length;

  const positiveShap = positives.slice(0, 5).map((l, i) => ({ l, v: 0.22 - i * 0.04 }));
  const negativeShap = negatives.slice(0, 5).map((l, i) => ({ l, v: -(0.16 - i * 0.03) }));

  const graphRel = new Map((graph.data?.links ?? []).map((l) => [l.target, l.rel]));
  const graphNodes = graph.data?.nodes.map((n) => ({ id: n.id, label: n.label, type: n.type, rel: graphRel.get(n.id) })) ?? [];

  const decisionTone = (d: Decision) =>
    d === "approved" ? "bg-emerald text-background hover:brightness-110"
    : d === "approved_with_conditions" ? "bg-sky text-background hover:brightness-110"
    : d === "needs_info" ? "bg-gold text-background hover:brightness-110"
    : "bg-rose text-background hover:brightness-110";

  return (
    <div className="space-y-8">
      <Link to="/lender/farmers" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to directory
      </Link>

      <SectionTitle
        eyebrow={farmer?.cooperative ?? "Independent farmer"}
        title={profile?.full_name ?? "Farmer"}
        sub={`${(farmer?.crops ?? []).join(", ") || "Crop"} farmer · ${farmer?.county ?? "—"} · ${farmer?.farm_size_acres ?? "—"} acres`}
        right={
          openLoan ? (
            <Link to="/lender/applications/$id" params={{ id: openLoan.id }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110">
              <Wallet className="h-4 w-4" /> Open decision workspace
            </Link>
          ) : null
        }
      />

      {/* SUMMARY ROW */}
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card title="Trust Score" icon={ShieldCheck}>
          <div className="flex flex-col items-center py-2">
            <Gauge score={score} max={100} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Tag label={`${riskLevel} risk`} tone={riskLevel === "Low" ? "emerald" : riskLevel === "High" ? "rose" : "gold"} />
              <Tag label={`AI: ${recommendation}`} tone={recommendation === "approve" ? "emerald" : recommendation === "decline" ? "rose" : "gold"} />
              <Tag label={`${trust?.climate_risk ?? "unknown"} climate`} tone={trust?.climate_risk === "low" ? "emerald" : trust?.climate_risk === "high" ? "rose" : "gold"} />
            </div>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          <KpiCard label="Recommended loan" value={`KES ${recommendedAmount.toLocaleString()}`} tone="emerald" icon={Wallet} sub={`${recommendedTerm} month term`} />
          <KpiCard label="Credit readiness" value={`${trust?.credit_readiness ?? 0}%`} tone="sky" icon={TrendingUp} />
          <KpiCard label="Loans repaid" value={String(repaid)} tone="emerald" icon={BadgeCheck} sub={`${active} active`} />
          <KpiCard label="Approved value" value={`KES ${totalApproved.toLocaleString()}`} tone="emerald" icon={Receipt} />
        </div>
      </div>

      {/* AI EXPLANATION */}
      <Card title="AI Explanation · why this score" icon={Brain}>
        <p className="text-sm leading-relaxed">{narrative}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-emerald">Supporting trust signals</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {positives.length ? positives.map((f) => <li key={f}>+ {f}</li>) : <li className="text-muted-foreground">—</li>}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-rose">Reduced confidence</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {negatives.length ? negatives.map((f) => <li key={f}>− {f}</li>) : <li className="text-muted-foreground">—</li>}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-sky">How the farmer can improve</p>
            <ul className="mt-1 space-y-0.5 text-sm">
              {recommendations.length ? recommendations.map((f) => <li key={f}>→ {f}</li>) : <li className="text-muted-foreground">—</li>}
            </ul>
          </div>
        </div>
      </Card>

      {/* BEHAVIOUR & RISK GRID */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Repayment behaviour" value={`${repayment}/100`} tone={repayment >= 70 ? "emerald" : repayment >= 50 ? "gold" : "rose"} icon={Receipt} sub={`${repayRecords} repayment events`} />
        <KpiCard label="Mobile money" value={`${mobileMoney}/100`} tone={mobileMoney >= 70 ? "emerald" : "gold"} icon={Smartphone} sub={farmer?.uses_mobile_money ? farmer.mobile_money_provider ?? "M-Pesa" : "Not active"} />
        <KpiCard label="Cooperative strength" value={`${cooperative}/100`} tone={cooperative >= 70 ? "emerald" : "gold"} icon={Users} sub={farmer?.cooperative ?? "Independent"} />
        <KpiCard label="Production history" value={`${production}/100`} tone={production >= 70 ? "emerald" : "gold"} icon={Sprout} sub={`${harvestRecords} harvests · ${saleRecords} sales`} />
        <KpiCard label="Climate risk" value={trust?.climate_risk ?? "—"} tone={trust?.climate_risk === "low" ? "emerald" : trust?.climate_risk === "high" ? "rose" : "gold"} icon={CloudRain} sub={`Resilience ${climateResilience}/100`} />
        <KpiCard label="Pest risk" value={pestRisk} tone={pestRisk === "Low" ? "emerald" : pestRisk === "High" ? "rose" : "gold"} icon={Bug} sub={`${pestEvents + weatherEvents} reported events`} />
        <KpiCard label="Recommended size" value={`KES ${recommendedAmount.toLocaleString()}`} tone="sky" icon={Wallet} />
        <KpiCard label="Recommended term" value={`${recommendedTerm} months`} tone="sky" icon={TrendingUp} />
      </div>

      {/* DECISION PANEL */}
      <Card
        title={openLoan ? `Decision · application KES ${Number(openLoan.amount_kes).toLocaleString()}` : "Decision"}
        icon={CheckCircle2}
        action={openLoan ? <Tag label={openLoan.status.replaceAll("_", " ")} tone="sky" /> : null}
      >
        {!openLoan ? (
          <p className="text-sm text-muted-foreground">
            No loan application on file for this farmer yet. Decisions activate as soon as the farmer submits a request.
          </p>
        ) : (
          <>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reviewer notes (shared with the farmer)"
              className="mb-4 w-full rounded-md border border-border/60 bg-surface-elevated/60 p-3 text-sm"
              rows={3}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {([
                { l: "Approve", d: "approved" as const, Icon: CheckCircle2 },
                { l: "Approve with Conditions", d: "approved_with_conditions" as const, Icon: ShieldCheck },
                { l: "Request More Info", d: "needs_info" as const, Icon: Brain },
                { l: "Reject", d: "rejected" as const, Icon: XCircle },
              ]).map(({ l, d, Icon }) => (
                <button
                  key={l}
                  disabled={decide.isPending}
                  onClick={() => decide.mutate(d)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-semibold transition disabled:opacity-50 ${decisionTone(d)}`}
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
            <p className="mt-3 text-[11px] text-muted-foreground">
              Every recommendation is grounded in the trust signals above. Use the decision workspace for the full Masumi-paid credit profile.
            </p>
          </>
        )}
      </Card>

      {/* CONTACT + TREND */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Contact" icon={Users}>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {profile?.phone ?? "—"}</li>
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {profile?.email ?? "—"}</li>
            <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /> {farmer?.county ?? "—"}, Kenya</li>
            <li className="flex items-center gap-2"><Sprout className="h-3.5 w-3.5 text-muted-foreground" /> {(farmer?.crops ?? []).join(", ") || "—"} · {farmer?.farm_size_acres ?? "—"} ac</li>
          </ul>
        </Card>
        <Card title="Trust trend" icon={TrendingUp} className="lg:col-span-2">
          <Sparkline data={history} labels={detail.data.trustHistory?.map((h) => new Date(h.computed_at).toLocaleString("en", { month: "short" }))} />
        </Card>
      </div>

      {/* FACTORS + LOAN ACTIVITY */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Factor contributions" icon={ShieldCheck}>
          <ShapBars positive={positiveShap} negative={negativeShap} />
        </Card>
        <Card title="Loan activity (KES, thousands)" icon={CloudRain}>
          <Bars data={loans.length ? loans.map((l) => Math.round(Number(l.amount_kes ?? 0) / 1000)) : [0]} labels={loans.map((l) => l.status)} />
        </Card>
      </div>

      {/* GRAPH */}
      <Card title="Graph relationships" icon={Users} action={<Tag label={graph.data?.source === "neo4j" ? "Live · Neo4j" : "Fallback"} tone={graph.data?.source === "neo4j" ? "emerald" : "gold"} />}>
        <NetworkGraph centerLabel={(profile?.full_name ?? "Farmer").split(" ")[0]} nodes={graphNodes} />
      </Card>

      {/* TIMELINE */}
      <Card title="Timeline">
        <ul className="space-y-3 text-sm">
          {loans.map((l) => (
            <li key={l.id} className="flex items-start gap-4 rounded-xl bg-surface-elevated/60 p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</span>
              <span className="flex-1">Loan application · KES {Number(l.amount_kes).toLocaleString()}</span>
              <Tag label={l.status} tone={l.status === "repaid" || l.status === "approved" ? "emerald" : l.status === "rejected" ? "rose" : "gold"} />
            </li>
          ))}
          {loans.length === 0 && <li className="text-sm text-muted-foreground">No loan activity yet.</li>}
        </ul>
      </Card>
    </div>
  );
}
