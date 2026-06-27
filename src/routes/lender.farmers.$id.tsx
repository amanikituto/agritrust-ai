import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  BadgeCheck,
  CloudRain,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sprout,
  TrendingUp,
  Users,
  Wallet,
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

export const Route = createFileRoute("/lender/farmers/$id")({
  component: FarmerProfile,
});

function FarmerProfile() {
  const { id } = useParams({ from: "/lender/farmers/$id" });
  const getFn = useServerFn(getFarmerDetail);
  const graphFn = useServerFn(getNetworkGraph);
  const detail = useQuery({ queryKey: ["lender", "farmer", id], queryFn: () => getFn({ data: { id } }) });
  const graph = useQuery({ queryKey: ["graph", "farmer", id], queryFn: () => graphFn({ data: { centerId: id } }) });

  if (detail.isLoading) return <p className="p-10 text-muted-foreground">Loading farmer profile…</p>;
  if (!detail.data?.farmer && !detail.data?.profile) return <div className="p-10 text-center text-muted-foreground">Farmer not found.</div>;

  const farmer = detail.data.farmer;
  const profile = detail.data.profile;
  const trust = detail.data.trust;
  const loans = detail.data.loans ?? [];
  const approved = loans.filter((l) => ["approved", "disbursed", "repaid"].includes(l.status)).length;
  const repaid = loans.filter((l) => l.status === "repaid").length;
  const active = loans.filter((l) => ["approved", "disbursed"].includes(l.status)).length;
  const totalApproved = loans.filter((l) => ["approved", "disbursed", "repaid"].includes(l.status)).reduce((sum, l) => sum + Number(l.amount_kes ?? 0), 0);
  const history = detail.data.trustHistory?.length ? detail.data.trustHistory.map((h) => h.score) : [trust?.score ?? 0];
  const positive = (trust?.top_positive_factors ?? ["Verified farmer profile", "Farm records available"]).map((l, i) => ({ l, v: 0.18 - i * 0.04 }));
  const negative = (trust?.top_negative_factors ?? ["More repayment history needed"]).map((l, i) => ({ l, v: -(0.12 - i * 0.03) }));
  const graphRel = new Map((graph.data?.links ?? []).map((l) => [l.target, l.rel]));
  const graphNodes = graph.data?.nodes.map((n) => ({ id: n.id, label: n.label, type: n.type, rel: graphRel.get(n.id) })) ?? [];

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
          loans[0] ? (
            <Link to="/lender/applications/$id" params={{ id: loans[0].id }} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110">
              <Wallet className="h-4 w-4" /> Open latest decision
            </Link>
          ) : (
            <Link to="/lender/applications" className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110">
              <Wallet className="h-4 w-4" /> View queue
            </Link>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card title="Trust Score" icon={ShieldCheck}>
          <div className="flex flex-col items-center py-2">
            <Gauge score={trust?.score ?? 0} max={100} />
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Tag label={trust ? "Live trust score" : "No score yet"} tone={trust ? "emerald" : "gold"} />
              <Tag label={`${trust?.climate_risk ?? "unknown"} climate`} tone={trust?.climate_risk === "low" ? "emerald" : trust?.climate_risk === "high" ? "rose" : "gold"} />
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard label="Loans repaid" value={String(repaid)} tone="emerald" icon={BadgeCheck} />
          <KpiCard label="Active loans" value={String(active)} tone="sky" icon={Wallet} />
          <KpiCard label="Approved value" value={`KES ${totalApproved.toLocaleString()}`} tone="emerald" icon={TrendingUp} />
          <KpiCard label="Credit readiness" value={`${trust?.credit_readiness ?? 0}%`} tone="sky" icon={Wallet} sub={`${approved} approved/repaid`} />
        </div>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Factor contributions" icon={ShieldCheck}>
          <ShapBars positive={positive} negative={negative} />
        </Card>
        <Card title="Loan activity (KES)", icon={CloudRain}>
          <Bars data={loans.length ? loans.map((l) => Math.round(Number(l.amount_kes ?? 0) / 1000)) : [0]} labels={loans.map((l) => l.status)} />
        </Card>
      </div>

      <Card title="Relationship network" icon={Users} action={<Tag label={graph.data?.source === "neo4j" ? "Live · Neo4j" : "Fallback"} tone={graph.data?.source === "neo4j" ? "emerald" : "gold"} />}>
        <NetworkGraph centerLabel={(profile?.full_name ?? "Farmer").split(" ")[0]} nodes={graphNodes} />
      </Card>

      <Card title="Timeline">
        <ul className="space-y-3 text-sm">
          {loans.map((l) => (
            <li key={l.id} className="flex items-start gap-4 rounded-xl bg-surface-elevated/60 p-3">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</span>
              <span className="flex-1">Loan application · KES {Number(l.amount_kes).toLocaleString()}</span>
              <span className="text-xs text-emerald">{l.status}</span>
            </li>
          ))}
          {loans.length === 0 && <li className="text-sm text-muted-foreground">No loan activity yet.</li>}
        </ul>
      </Card>
    </div>
  );
}