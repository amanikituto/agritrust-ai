import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Filter, AlertTriangle, Users, FileCheck, TrendingUp, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { listFarmers } from "@/lib/farmers.functions";
import { listAllLoans } from "@/lib/operations.functions";
import { riskMeta } from "@/components/TrustGauge";

export const Route = createFileRoute("/lender")({
  head: () => ({ meta: [{ title: "Loan Officer Dashboard · AgriTrust AI" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { role: "lender" } });
  },
  component: LenderDashboard,
});

function LenderDashboard() {
  const farmersQ = useQuery({ queryKey: ["farmers"], queryFn: () => listFarmers() });
  const loansQ = useQuery({ queryKey: ["loans-all"], queryFn: () => listAllLoans() });

  const [county, setCounty] = useState("");
  const [crop, setCrop] = useState("");
  const [gender, setGender] = useState("");
  const [youth, setYouth] = useState(false);
  const [pwd, setPwd] = useState(false);
  const [coop, setCoop] = useState("");
  const [risk, setRisk] = useState("");
  const [status, setStatus] = useState("");

  const farmers = farmersQ.data ?? [];
  const loans = loansQ.data ?? [];

  const filtered = useMemo(() => farmers.filter((f) => {
    if (county && f.county !== county) return false;
    if (crop && !(f.crops ?? []).includes(crop)) return false;
    if (gender && f.gender !== gender) return false;
    if (youth && !f.is_youth) return false;
    if (pwd && !f.has_disability) return false;
    if (coop && f.cooperative !== coop) return false;
    if (risk) {
      const s = f.trust_score ?? 0;
      const band = s >= 80 ? "low" : s >= 60 ? "moderate" : s >= 40 ? "high" : "needs";
      if (band !== risk) return false;
    }
    if (status && f.loan_status !== status) return false;
    return true;
  }), [farmers, county, crop, gender, youth, pwd, coop, risk, status]);

  const counties = uniq(farmers.map((f) => f.county).filter(Boolean) as string[]);
  const crops = uniq(farmers.flatMap((f) => f.crops ?? []));
  const coops = uniq(farmers.map((f) => f.cooperative).filter(Boolean) as string[]);

  const scored = farmers.filter((f) => f.trust_score != null);
  const avgScore = scored.length ? Math.round(scored.reduce((a, f) => a + (f.trust_score ?? 0), 0) / scored.length) : 0;
  const ready = farmers.filter((f) => (f.trust_score ?? 0) >= 60).length;
  const climateAlerts = farmers.filter((f) => f.climate_risk === "high").length;
  const pending = loans.filter((l) => l.status === "submitted" || l.status === "under_review").length;

  return (
    <div className="min-h-dvh">
      <SiteHeader variant="app" />
      <main className="container-page py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-leaf">Loan Officer Dashboard</h1>
            <p className="text-sm text-charcoal/70">Review farmers and decide on credit fairly.</p>
          </div>
          <Link to="/farmer-intake" className="btn-primary">+ Register Farmer</Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Kpi icon={Users} label="Total farmers" value={farmers.length} />
          <Kpi icon={FileCheck} label="Pending applications" value={pending} />
          <Kpi icon={TrendingUp} label="Average Trust Score" value={avgScore} />
          <Kpi icon={ArrowRight} label="Credit-ready" value={ready} tone="success" />
          <Kpi icon={Cloud} label="Climate alerts" value={climateAlerts} tone="warning" />
        </div>

        {/* Applications queue */}
        {loans.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-bold">Active loan applications</h2>
            <div className="card-soft mt-3 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-xs uppercase text-charcoal/60">
                  <tr><Th>Farmer</Th><Th>County</Th><Th>Amount</Th><Th>Term</Th><Th>Source</Th><Th>Score</Th><Th>Status</Th><Th></Th></tr>
                </thead>
                <tbody>
                  {loans.slice(0, 8).map((l) => (
                    <tr key={l.id} className="border-t border-border/60">
                      <Td><span className="font-medium">{l.farmer_name}</span></Td>
                      <Td>{l.county}</Td>
                      <Td>KES {Number(l.amount_kes).toLocaleString()}</Td>
                      <Td>{l.term_months}m</Td>
                      <Td><span className="chip bg-muted">{l.source ?? "web"}</span></Td>
                      <Td>{l.trust_score_snapshot ?? "—"}</Td>
                      <Td><span className="chip bg-sun-soft text-earth capitalize">{l.status.replaceAll("_"," ")}</span></Td>
                      <Td>
                        <Link to="/lender/farmer/$id" params={{ id: l.id }} className="btn-secondary py-1.5 text-xs">Review</Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2 text-sm text-charcoal/70"><Filter className="h-4 w-4" /> Filters</div>
          <div className="card-soft p-4">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Sel value={county} onChange={setCounty} label="County" options={counties} />
              <Sel value={crop} onChange={setCrop} label="Crop" options={crops} />
              <Sel value={gender} onChange={setGender} label="Gender" options={["female","male","non_binary"]} />
              <Sel value={coop} onChange={setCoop} label="Cooperative" options={coops} />
              <Sel value={risk} onChange={setRisk} label="Risk level" options={["low","moderate","high","needs"]} />
              <Sel value={status} onChange={setStatus} label="Loan status" options={["submitted","under_review","approved","approved_with_conditions","rejected"]} />
              <Toggle label="Youth only" value={youth} onChange={setYouth} />
              <Toggle label="Living with disability" value={pwd} onChange={setPwd} />
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold">Farmers ({filtered.length})</h2>
          <div className="card-soft mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase text-charcoal/60">
                <tr><Th>Name</Th><Th>County</Th><Th>Crop</Th><Th>Inclusion</Th><Th>Score</Th><Th>Risk</Th><Th>Loan</Th><Th></Th></tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const s = f.trust_score ?? 0;
                  const r = riskMeta(s);
                  const inclusionTags: string[] = [];
                  if (f.gender === "female") inclusionTags.push("Woman");
                  if (f.is_youth) inclusionTags.push("Youth");
                  if (f.has_disability) inclusionTags.push("PWD");
                  return (
                    <tr key={f.id} className="border-t border-border/60 hover:bg-cream">
                      <Td><Link to="/farmer/$id" params={{ id: f.id }} className="font-medium text-leaf hover:underline">{f.name}</Link></Td>
                      <Td>{f.county}</Td>
                      <Td className="capitalize">{(f.crops ?? []).slice(0,2).join(", ") || "—"}</Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">{inclusionTags.map((t) => <span key={t} className="chip bg-leaf-soft text-leaf">{t}</span>)}</div>
                      </Td>
                      <Td><span className="font-display text-base font-bold" style={{ color: r.color }}>{s}</span></Td>
                      <Td><span className="chip" style={{ background: `color-mix(in oklab, ${r.color} 18%, white)`, color: r.color }}>{r.label}</span></Td>
                      <Td><span className="text-xs capitalize text-charcoal/70">{f.loan_status?.replaceAll("_"," ") ?? "—"}</span></Td>
                      <Td>
                        <Link to="/farmer/$id" params={{ id: f.id }} className="btn-secondary py-1.5 text-xs">Review</Link>
                      </Td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-charcoal/60">No farmers match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {climateAlerts > 0 && (
          <div className="mt-8 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <strong>{climateAlerts} farmer{climateAlerts === 1 ? "" : "s"}</strong> currently flagged as
              high climate risk — consider insurance bundling or shorter loan terms.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; tone?: "success" | "warning" }) {
  const color = tone === "success" ? "var(--success)" : tone === "warning" ? "var(--warning)" : "var(--leaf)";
  return (
    <div className="card-soft p-5">
      <div className="flex items-center gap-2 text-xs uppercase text-charcoal/60"><Icon className="h-4 w-4" />{label}</div>
      <div className="mt-2 font-display text-3xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
function Th({ children }: { children?: React.ReactNode }) { return <th className="px-4 py-3 font-semibold">{children}</th>; }
function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) { return <td className={`px-4 py-3 ${className}`}>{children}</td>; }
function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium uppercase tracking-wider text-charcoal/60">{label}</span>
      <select className="field text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o} value={o} className="capitalize">{o.replaceAll("_"," ")}</option>)}
      </select>
    </label>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2.5 text-sm">
      <span className="text-charcoal/80">{label}</span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-leaf" />
    </label>
  );
}
function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }
