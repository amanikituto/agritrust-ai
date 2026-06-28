import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { getMyProfile, saveFarmerIntake } from "@/lib/farmer-data.functions";

export const Route = createFileRoute("/farmer/intake")({
  component: IntakePage,
});

const CROPS = ["Maize", "Beans", "Coffee", "Tea", "Horticulture", "Dairy", "Poultry", "Bananas", "Sugarcane", "Rice"];
const RISKS = ["Drought", "Floods", "Pests", "Rainfall variability", "Heatwave", "Frost"];
const ADAPT = ["Drought-tolerant seed", "Mulching", "Agroforestry", "Cover crops", "Water harvesting", "Crop rotation"];

const STEPS = ["Personal", "Inclusion", "Farm", "Financial", "Climate", "Cooperative", "Consent"] as const;

function IntakePage() {
  const navigate = useNavigate();
  const fetchFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(saveFarmerIntake);
  const me = useQuery({ queryKey: ["me", "profile"], queryFn: () => fetchFn() });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Record<string, any>>({});

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const toggle = (k: string, v: string) => {
    const arr = (form[k] as string[] | undefined) ?? [];
    set(k, arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  };

  const save = useMutation({
    mutationFn: () => saveFn({ data: form }),
    onSuccess: () => navigate({ to: "/farmer/trust-score" }),
  });

  // Hydrate once from existing profile
  if (me.data && Object.keys(form).length === 0 && (me.data.farmer || me.data.profile)) {
    const f: any = me.data.farmer ?? {};
    setForm({
      full_name: me.data.profile?.full_name ?? "",
      phone: me.data.profile?.phone ?? "",
      national_id: f.national_id,
      gender: f.gender,
      county: f.county,
      sub_county: f.sub_county,
      ward: f.ward,
      household_size: f.household_size,
      years_farming: f.years_farming,
      primary_language: f.primary_language,
      has_disability: f.has_disability,
      is_youth: f.is_youth,
      land_ownership: f.land_ownership,
      primary_decision_maker: f.primary_decision_maker,
      controls_income: f.controls_income,
      owns_phone: f.owns_phone,
      uses_mobile_money: f.uses_mobile_money,
      in_women_group: f.in_women_group,
      in_youth_group: f.in_youth_group,
      in_disability_group: f.in_disability_group,
      faces_credit_barriers: f.faces_credit_barriers,
      inclusion_notes: f.inclusion_notes,
      farm_size_acres: f.farm_size_acres,
      crops: f.crops ?? [],
      livestock: f.livestock ?? [],
      irrigation: f.irrigation,
      storage: f.storage,
      mechanization: f.mechanization,
      input_suppliers: f.input_suppliers ?? [],
      main_buyers: f.main_buyers ?? [],
      production_estimate: f.production_estimate,
      mobile_money_provider: f.mobile_money_provider,
      savings_method: f.savings_method,
      has_insurance: f.has_insurance,
      climate_risks: f.climate_risks ?? [],
      adaptation_practices: f.adaptation_practices ?? [],
      water_access: f.water_access,
      cooperative: f.cooperative,
      coop_years: f.coop_years,
      coop_role: f.coop_role,
      peer_guarantee: f.peer_guarantee,
      extension_visits_per_year: f.extension_visits_per_year,
      consent_data_use: f.consent_data_use,
    });
  }

  const Field = ({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={form[name] ?? ""}
        placeholder={placeholder}
        onChange={(e) => set(name, type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value)}
        className="h-10 rounded-md border border-border bg-surface-elevated/60 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald"
      />
    </label>
  );

  const Toggle = ({ label, name }: { label: string; name: string }) => (
    <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface-elevated/40 p-3 text-sm">
      <input type="checkbox" checked={!!form[name]} onChange={(e) => set(name, e.target.checked)} />
      {label}
    </label>
  );

  const Multi = ({ label, name, options }: { label: string; name: string; options: string[] }) => (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = ((form[name] as string[]) ?? []).includes(o);
          return (
            <button key={o} type="button" onClick={() => toggle(name, o)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-emerald bg-emerald/10 text-emerald" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Farmer Intake" title="Build your Digital Trust Profile" sub="Capturing alternative data that traditional lenders miss." />

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {STEPS.map((s, i) => (
            <Tag key={s} label={`${i + 1}. ${s}`} tone={i === step ? "emerald" : i < step ? "sky" : "gold"} />
          ))}
        </div>

        {step === 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" name="full_name" />
            <Field label="National ID" name="national_id" />
            <Field label="Phone" name="phone" placeholder="+2547…" />
            <Field label="Primary language" name="primary_language" placeholder="Swahili" />
            <Field label="County" name="county" />
            <Field label="Sub-county" name="sub_county" />
            <Field label="Ward" name="ward" />
            <Field label="Household size" name="household_size" type="number" />
            <Field label="Years farming" name="years_farming" type="number" />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Gender</span>
              <select value={form.gender ?? ""} onChange={(e) => set("gender", e.target.value || null)}
                className="h-10 rounded-md border border-border bg-surface-elevated/60 px-3 text-sm">
                <option value="">Prefer not to say</option>
                <option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
              </select>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">These fields enrich your profile and never reduce your score — they help lenders offer fair and inclusive products.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle label="I am the primary farming decision maker" name="primary_decision_maker" />
              <Toggle label="I control my farm income" name="controls_income" />
              <Toggle label="I own a mobile phone" name="owns_phone" />
              <Toggle label="I use mobile money" name="uses_mobile_money" />
              <Toggle label="Member of a women's group" name="in_women_group" />
              <Toggle label="Member of a youth group" name="in_youth_group" />
              <Toggle label="Member of a disability support group" name="in_disability_group" />
              <Toggle label="Live with a disability" name="has_disability" />
              <Toggle label="Faces barriers accessing credit" name="faces_credit_barriers" />
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Land ownership</span>
              <select value={form.land_ownership ?? ""} onChange={(e) => set("land_ownership", e.target.value || null)}
                className="h-10 rounded-md border border-border bg-surface-elevated/60 px-3 text-sm">
                <option value="">Select…</option>
                <option value="owned">Owned</option><option value="leased">Leased</option><option value="family">Family land</option><option value="communal">Communal</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Inclusion notes (optional)</span>
              <textarea value={form.inclusion_notes ?? ""} onChange={(e) => set("inclusion_notes", e.target.value)}
                rows={2} className="rounded-md border border-border bg-surface-elevated/60 p-3 text-sm" />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Farm size (acres)" name="farm_size_acres" type="number" />
            <Field label="Storage" name="storage" placeholder="Granary, cold-room…" />
            <Field label="Mechanization" name="mechanization" placeholder="Tractor, ox-plough…" />
            <Field label="Production estimate" name="production_estimate" placeholder="e.g. 25 bags/season" />
            <Toggle label="Irrigation in use" name="irrigation" />
            <div className="sm:col-span-2"><Multi label="Main crops" name="crops" options={CROPS} /></div>
            <Field label="Input suppliers (comma-separated)" name="_inputs_text"
              placeholder="Agrovet Kiambu, …" />
            <Field label="Main buyers (comma-separated)" name="_buyers_text" />
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Mobile money provider" name="mobile_money_provider" placeholder="M-Pesa" />
            <Field label="Savings method" name="savings_method" placeholder="SACCO / Chama / Bank" />
            <Toggle label="Has crop or livestock insurance" name="has_insurance" />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Multi label="Climate risks faced" name="climate_risks" options={RISKS} />
            <Multi label="Adaptation practices" name="adaptation_practices" options={ADAPT} />
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Water access</span>
              <select value={form.water_access ?? ""} onChange={(e) => set("water_access", e.target.value || null)}
                className="h-10 rounded-md border border-border bg-surface-elevated/60 px-3 text-sm">
                <option value="">Select…</option>
                <option value="reliable">Reliable</option><option value="seasonal">Seasonal</option><option value="scarce">Scarce</option>
              </select>
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cooperative" name="cooperative" />
            <Field label="Years in cooperative" name="coop_years" type="number" />
            <Field label="Cooperative role" name="coop_role" placeholder="Member, Treasurer…" />
            <Field label="Extension visits per year" name="extension_visits_per_year" type="number" />
            <Toggle label="Have a peer guarantor in the group" name="peer_guarantee" />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald/40 bg-emerald/5 p-4 text-sm">
              <p className="mb-2 font-semibold text-emerald">Consent & Responsible AI</p>
              <p className="text-muted-foreground">
                I consent to AgriTrust AI storing this profile, computing an explainable
                Trust Score from it, and sharing a redacted version with lenders I authorise.
                I understand my gender, age, disability status and land ownership are never
                used as negative scoring factors, and I can withdraw consent at any time.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.consent_data_use} onChange={(e) => set("consent_data_use", e.target.checked)} />
              I agree to the consent statement above.
            </label>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm disabled:opacity-40">
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => {
              if (step === 2) {
                const tIn = (form._inputs_text as string | undefined)?.split(",").map((s) => s.trim()).filter(Boolean);
                const tBu = (form._buyers_text as string | undefined)?.split(",").map((s) => s.trim()).filter(Boolean);
                if (tIn) set("input_suppliers", tIn);
                if (tBu) set("main_buyers", tBu);
              }
              setStep((s) => Math.min(STEPS.length - 1, s + 1));
            }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button disabled={!form.consent_data_use || save.isPending} onClick={() => save.mutate()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
              <Sparkles className="h-4 w-4" /> {save.isPending ? "Saving & scoring…" : "Save & compute Trust Score"}
            </button>
          )}
        </div>
        {save.error && <p className="mt-2 text-xs text-rose">{(save.error as Error).message}</p>}
      </Card>

      <Card title="Why we ask" icon={ShieldCheck}>
        <p className="text-sm text-muted-foreground">
          Every field here adds an alternative-data signal — cooperative history, mobile money use,
          climate resilience, training engagement — so creditworthy farmers who lack land title
          or formal collateral can still become visible to lenders.
        </p>
      </Card>
    </div>
  );
}
