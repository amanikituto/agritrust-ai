import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Network, Phone, Sprout, Cloud, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { TrustGauge, riskMeta } from "@/components/TrustGauge";
import { getFarmerById } from "@/lib/farmers.functions";

export const Route = createFileRoute("/farmer/$id")({
  head: () => ({ meta: [{ title: "Farmer Profile · AgriTrust AI" }] }),
  component: FarmerProfile,
});

function FarmerProfile() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["farmer", id],
    queryFn: () => getFarmerById({ data: { id } }),
  });

  if (isLoading) return <Skel />;
  if (!data) return <Empty />;

  const { profile, farmer, trust } = data;
  const score = trust?.score ?? 50;
  const r = riskMeta(score);
  const positives = (trust?.top_positive_factors ?? []) as string[];
  const negatives = (trust?.top_negative_factors ?? []) as string[];
  const recs = (trust?.recommendations ?? []) as string[];
  const narrative = (trust?.components as { narrative?: string } | null)?.narrative ?? "Trust score not yet generated.";

  return (
    <div className="min-h-dvh">
      <SiteHeader variant="app" />
      <main className="container-page py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-leaf">{profile?.full_name ?? "Farmer"}</h1>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-charcoal/70">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{farmer?.county ?? "—"}</span>
              <span className="inline-flex items-center gap-1"><Sprout className="h-4 w-4" />{(farmer?.crops ?? []).join(", ") || "—"}</span>
              {profile?.phone && <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" />{profile.phone}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/graph/$farmerId" params={{ farmerId: id }} className="btn-secondary">
              <Network className="h-4 w-4" /> View Graph
            </Link>
            <Link to="/farmer/updates" search={{ id }} className="btn-primary">
              Update Records <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="card-soft p-6 lg:col-span-1">
            <div className="text-xs uppercase tracking-wider text-charcoal/60">Trust Score</div>
            <div className="mt-4 grid place-items-center">
              <TrustGauge score={score} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
              <Stat label="Credit Readiness" value={`${trust?.credit_readiness ?? 0}%`} />
              <Stat label="Climate Risk" value={String(trust?.climate_risk ?? "—")} />
              <Stat label="Recommended" value={`KES ${(trust?.loan_eligibility_kes ?? 0).toLocaleString()}`} />
              <Stat label="Risk Band" value={r.label} color={r.color} />
            </div>
          </div>

          <div className="card-soft p-6 lg:col-span-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-leaf" />
              <h2 className="font-display text-lg font-bold">AI Explanation</h2>
            </div>
            <p className="mt-3 rounded-lg bg-cream p-4 text-sm leading-relaxed">{narrative}</p>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Factors title="Key trust signals" tone="success" items={positives} fallback="Continue logging activity to surface strengths." />
              <Factors title="Risk signals" tone="danger" items={negatives} fallback="No major risks detected." />
            </div>
            {recs.length > 0 && (
              <div className="mt-5 rounded-lg border border-sun bg-sun-soft/40 p-4 text-sm">
                <div className="mb-1 font-semibold text-earth">Recommended next steps</div>
                <ul className="list-disc pl-5 text-charcoal/80">{recs.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card-soft p-6">
            <h3 className="font-display font-bold">Inclusion context</h3>
            <p className="mt-1 text-xs text-charcoal/60">For inclusive lending — never penalised in scoring.</p>
            <div className="mt-4 grid gap-2 text-sm">
              <Row k="Gender" v={farmer?.gender ?? "—"} />
              <Row k="Main decision-maker" v={yes(farmer?.primary_decision_maker)} />
              <Row k="Controls income" v={yes(farmer?.controls_income)} />
              <Row k="Owns phone" v={yes(farmer?.owns_phone)} />
              <Row k="Women's group" v={yes(farmer?.in_women_group)} />
              <Row k="Youth group" v={yes(farmer?.in_youth_group)} />
              <Row k="Disability group" v={yes(farmer?.in_disability_group)} />
              <Row k="Land access" v={farmer?.land_ownership ?? "—"} />
            </div>
          </div>

          <div className="card-soft p-6">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-leaf" />
              <h3 className="font-display font-bold">Climate profile</h3>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <Row k="Water access" v={farmer?.water_access ?? "—"} />
              <Row k="Irrigation" v={yes(farmer?.irrigation)} />
              <Row k="Insurance" v={yes(farmer?.has_insurance)} />
              <Row k="Climate risks" v={(farmer?.climate_risks ?? []).join(", ") || "—"} />
              <Row k="Adaptation practices" v={(farmer?.adaptation_practices ?? []).join(", ") || "—"} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function yes(v?: boolean | null) { return v == null ? "—" : v ? "Yes" : "No"; }
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex items-center justify-between border-b border-border/60 pb-2 last:border-0"><span className="text-charcoal/60">{k}</span><span className="font-medium">{v}</span></div>;
}
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return <div className="rounded-lg border border-border p-3"><div className="text-xs text-charcoal/60">{label}</div><div className="mt-1 font-display text-lg font-bold" style={{ color: color ?? "var(--leaf)" }}>{value}</div></div>;
}
function Factors({ title, tone, items, fallback }: { title: string; tone: "success" | "danger"; items: string[]; fallback: string }) {
  return (
    <div>
      <div className={`text-xs font-semibold uppercase tracking-wider ${tone === "success" ? "text-leaf" : "text-danger"}`}>{title}</div>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5 text-sm">{items.map((s) => <li key={s} className="flex gap-2"><span className={tone === "success" ? "text-leaf" : "text-danger"}>•</span>{s}</li>)}</ul>
      ) : (
        <p className="mt-2 text-sm text-charcoal/60">{fallback}</p>
      )}
    </div>
  );
}
function Skel() {
  return <div className="min-h-dvh"><SiteHeader variant="app" /><div className="container-page py-20 text-center text-charcoal/60">Loading farmer profile…</div></div>;
}
function Empty() {
  return <div className="min-h-dvh"><SiteHeader variant="app" /><div className="container-page py-20 text-center"><h1 className="font-display text-2xl font-bold">Farmer not found</h1><Link to="/" className="btn-primary mt-4 inline-flex">Home</Link></div></div>;
}
