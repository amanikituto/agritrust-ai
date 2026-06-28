import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { registerFarmer, type IntakeInput } from "@/lib/farmers.functions";

export const Route = createFileRoute("/farmer-intake")({
  head: () => ({ meta: [{ title: "Register Farmer · AgriTrust AI" }] }),
  component: Intake,
});

const KENYAN_COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Uasin Gishu","Kiambu","Murang'a","Nyeri","Meru","Embu",
  "Machakos","Makueni","Kitui","Garissa","Bungoma","Busia","Kakamega","Vihiga","Siaya","Migori",
  "Homa Bay","Kisii","Nyamira","Kericho","Bomet","Narok","Kajiado","Trans Nzoia","Laikipia","Baringo",
];
const CROPS = ["Maize","Beans","Coffee","Tea","Tomato","Kale","Sugarcane","Bananas","Potato","Cassava","Sorghum","Rice"];
const LIVESTOCK = ["Dairy cows","Beef cattle","Goats","Sheep","Chicken","Pigs"];
const CLIMATE_RISKS = ["Drought","Flood","Pests","Unreliable rainfall","Heatwave"];
const ADAPT = ["Cover crops","Crop rotation","Water harvesting","Drought-tolerant seed","Mulching","Agroforestry"];

const STEPS = ["Personal", "Farm", "Financial", "Inclusion", "Climate"];

function Intake() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<IntakeInput>({
    full_name: "", phone: "", county: "", primary_language: "en",
    owns_phone: true, primary_decision_maker: true, controls_income: true,
  });

  const mut = useMutation({
    mutationFn: () => registerFarmer({ data: d }),
    onSuccess: ({ farmerId }) => navigate({ to: "/farmer/$id", params: { id: farmerId } }),
  });

  const set = <K extends keyof IntakeInput>(k: K, v: IntakeInput[K]) => setD((x) => ({ ...x, [k]: v }));
  const toggleArr = (k: "other_crops" | "livestock" | "main_buyers" | "input_suppliers" | "climate_risks" | "adaptation_practices", v: string) => {
    const cur = (d[k] ?? []) as string[];
    setD((x) => ({ ...x, [k]: cur.includes(v) ? cur.filter((c) => c !== v) : [...cur, v] }));
  };

  function next() {
    if (step === 0 && (!d.full_name || !d.phone || !d.county)) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else mut.mutate();
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader variant="public" />
      <main className="container-page py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-leaf">Register a Farmer</h1>
          <p className="mt-1 text-sm text-charcoal/70">Capture intake, inclusion and climate data to generate a fair Trust Score.</p>

          <ol className="mt-8 flex flex-wrap gap-3">
            {STEPS.map((s, i) => (
              <li key={s} className={`chip ${i === step ? "bg-leaf text-white" : i < step ? "bg-leaf-soft text-leaf" : "bg-muted text-charcoal/70"}`}>
                {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{i+1}</span>}
                {s}
              </li>
            ))}
          </ol>

          <div className="card-soft mt-6 p-6">
            {step === 0 && (
              <Grid>
                <Field label="Full name *"><input className="field" value={d.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
                <Field label="Phone number *"><input className="field" placeholder="+2547..." value={d.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
                <Field label="National ID"><input className="field" value={d.national_id ?? ""} onChange={(e) => set("national_id", e.target.value)} /></Field>
                <Field label="Date of birth"><input type="date" className="field" value={d.date_of_birth ?? ""} onChange={(e) => set("date_of_birth", e.target.value)} /></Field>
                <Field label="County *">
                  <select className="field" value={d.county} onChange={(e) => set("county", e.target.value)}>
                    <option value="">Select county…</option>
                    {KENYAN_COUNTIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Sub-county"><input className="field" value={d.sub_county ?? ""} onChange={(e) => set("sub_county", e.target.value)} /></Field>
                <Field label="Ward"><input className="field" value={d.ward ?? ""} onChange={(e) => set("ward", e.target.value)} /></Field>
                <Field label="Village"><input className="field" value={d.village ?? ""} onChange={(e) => set("village", e.target.value)} /></Field>
                <Field label="Gender">
                  <select className="field" value={d.gender ?? ""} onChange={(e) => set("gender", (e.target.value || undefined) as IntakeInput["gender"])}>
                    <option value="">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non_binary">Non-binary</option>
                  </select>
                </Field>
                <Field label="Primary language">
                  <select className="field" value={d.primary_language} onChange={(e) => set("primary_language", e.target.value)}>
                    <option value="en">English</option><option value="sw">Kiswahili</option>
                    <option value="luo">Dholuo</option><option value="kik">Kikuyu</option>
                    <option value="kal">Kalenjin</option><option value="kam">Kamba</option>
                  </select>
                </Field>
                <Toggle label="Lives with a disability" value={d.has_disability} onChange={(v) => set("has_disability", v)} />
              </Grid>
            )}

            {step === 1 && (
              <Grid>
                <Field label="Farm size (acres)"><input type="number" step="0.1" className="field" value={d.farm_size_acres ?? ""} onChange={(e) => set("farm_size_acres", e.target.value ? Number(e.target.value) : undefined)} /></Field>
                <Field label="Years farming"><input type="number" className="field" value={d.years_farming ?? ""} onChange={(e) => set("years_farming", e.target.value ? Number(e.target.value) : undefined)} /></Field>
                <Field label="Main crop">
                  <select className="field" value={d.main_crop ?? ""} onChange={(e) => set("main_crop", e.target.value)}>
                    <option value="">Select…</option>
                    {CROPS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Land access">
                  <select className="field" value={d.land_ownership ?? ""} onChange={(e) => set("land_ownership", e.target.value)}>
                    <option value="">Select…</option>
                    <option value="own">Own land</option>
                    <option value="lease">Lease</option>
                    <option value="family">Family</option>
                    <option value="community">Community</option>
                  </select>
                </Field>
                <Chips label="Other crops" options={CROPS} selected={d.other_crops ?? []} onToggle={(v) => toggleArr("other_crops", v)} />
                <Chips label="Livestock" options={LIVESTOCK} selected={d.livestock ?? []} onToggle={(v) => toggleArr("livestock", v)} />
                <Toggle label="Has irrigation access" value={d.irrigation} onChange={(v) => set("irrigation", v)} />
                <Field label="Main buyer(s)"><input className="field" placeholder="comma-separated"
                  value={(d.main_buyers ?? []).join(", ")}
                  onChange={(e) => set("main_buyers", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></Field>
                <Field label="Input supplier(s)"><input className="field" placeholder="comma-separated"
                  value={(d.input_suppliers ?? []).join(", ")}
                  onChange={(e) => set("input_suppliers", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></Field>
              </Grid>
            )}

            {step === 2 && (
              <Grid>
                <Toggle label="Uses mobile money" value={d.uses_mobile_money} onChange={(v) => set("uses_mobile_money", v)} />
                <Field label="Mobile money provider">
                  <select className="field" value={d.mobile_money_provider ?? ""} onChange={(e) => set("mobile_money_provider", e.target.value)}>
                    <option value="">Select…</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="airtel">Airtel Money</option>
                    <option value="tkash">T-Kash</option>
                  </select>
                </Field>
                <Field label="Savings method">
                  <select className="field" value={d.savings_method ?? ""} onChange={(e) => set("savings_method", e.target.value)}>
                    <option value="">None</option>
                    <option value="sacco">SACCO</option>
                    <option value="chama">Chama/Group</option>
                    <option value="bank">Bank account</option>
                    <option value="mpesa">M-Shwari</option>
                  </select>
                </Field>
                <Field label="Cooperative name"><input className="field" value={d.cooperative ?? ""} onChange={(e) => set("cooperative", e.target.value)} /></Field>
                <Field label="Years in cooperative"><input type="number" className="field" value={d.coop_years ?? ""} onChange={(e) => set("coop_years", e.target.value ? Number(e.target.value) : undefined)} /></Field>
              </Grid>
            )}

            {step === 3 && (
              <>
                <p className="mb-4 rounded-lg bg-sun-soft/60 p-3 text-sm text-earth">
                  Inclusion data is captured for fair assessment — it never lowers the Trust Score.
                </p>
                <Grid>
                  <Toggle label="Main decision-maker on the farm" value={d.primary_decision_maker} onChange={(v) => set("primary_decision_maker", v)} />
                  <Toggle label="Controls income from produce" value={d.controls_income} onChange={(v) => set("controls_income", v)} />
                  <Toggle label="Has access to a mobile phone" value={d.owns_phone} onChange={(v) => set("owns_phone", v)} />
                  <Toggle label="Member of a women's group" value={d.in_women_group} onChange={(v) => set("in_women_group", v)} />
                  <Toggle label="Member of a youth group" value={d.in_youth_group} onChange={(v) => set("in_youth_group", v)} />
                  <Toggle label="Member of a disability support group" value={d.in_disability_group} onChange={(v) => set("in_disability_group", v)} />
                  <Toggle label="Faces barriers accessing credit" value={d.faces_credit_barriers} onChange={(v) => set("faces_credit_barriers", v)} />
                  <Field label="Notes on barriers"><textarea rows={3} className="field" value={d.inclusion_notes ?? ""} onChange={(e) => set("inclusion_notes", e.target.value)} /></Field>
                </Grid>
              </>
            )}

            {step === 4 && (
              <Grid>
                <Chips label="Climate risks experienced" options={CLIMATE_RISKS} selected={d.climate_risks ?? []} onToggle={(v) => toggleArr("climate_risks", v)} />
                <Field label="Rainfall reliability / water access">
                  <select className="field" value={d.water_access ?? ""} onChange={(e) => set("water_access", e.target.value)}>
                    <option value="">Select…</option>
                    <option value="reliable">Reliable</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="unreliable">Unreliable</option>
                  </select>
                </Field>
                <Toggle label="Has crop or livestock insurance" value={d.has_insurance} onChange={(v) => set("has_insurance", v)} />
                <Chips label="Climate adaptation practices" options={ADAPT} selected={d.adaptation_practices ?? []} onToggle={(v) => toggleArr("adaptation_practices", v)} />
              </Grid>
            )}

            {mut.isError && <p className="mt-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">{(mut.error as Error).message}</p>}

            <div className="mt-8 flex justify-between">
              <button className="btn-ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0 || mut.isPending}>
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <button className="btn-primary" onClick={next} disabled={mut.isPending}>
                {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : step === STEPS.length - 1 ? "Submit & Score" : "Next"}
                {!mut.isPending && step < STEPS.length - 1 && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 md:grid-cols-2">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm"><span className="mb-1 block font-medium text-charcoal/80">{label}</span>{children}</label>;
}
function Toggle({ label, value, onChange }: { label: string; value?: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-3 text-sm">
      <span>{label}</span>
      <button type="button" onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition ${value ? "bg-leaf" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${value ? "left-5" : "left-0.5"}`} />
      </button>
    </label>
  );
}
function Chips({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="md:col-span-2">
      <div className="mb-1 text-sm font-medium text-charcoal/80">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button key={o} type="button" onClick={() => onToggle(o)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${on ? "border-leaf bg-leaf text-white" : "border-border bg-white text-charcoal/70 hover:bg-muted"}`}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
