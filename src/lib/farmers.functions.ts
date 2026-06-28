// Public farmer intake — creates an anonymous-like farmer profile via the
// admin client. Used by rural officers registering farmers on their behalf.
import { createServerFn } from "@tanstack/react-start";

export type IntakeInput = {
  // Step 1
  full_name: string;
  phone: string;
  national_id?: string;
  county: string;
  sub_county?: string;
  ward?: string;
  village?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "non_binary" | "prefer_not_to_say";
  has_disability?: boolean;
  primary_language?: string;
  // Step 2
  farm_size_acres?: number;
  main_crop?: string;
  other_crops?: string[];
  livestock?: string[];
  years_farming?: number;
  land_ownership?: string;
  irrigation?: boolean;
  main_buyers?: string[];
  input_suppliers?: string[];
  // Step 3
  uses_mobile_money?: boolean;
  mobile_money_provider?: string;
  savings_method?: string;
  cooperative?: string;
  coop_years?: number;
  // Step 4 — inclusion (never penalised)
  primary_decision_maker?: boolean;
  controls_income?: boolean;
  owns_phone?: boolean;
  in_women_group?: boolean;
  in_youth_group?: boolean;
  in_disability_group?: boolean;
  faces_credit_barriers?: boolean;
  inclusion_notes?: string;
  // Step 5 — climate
  climate_risks?: string[];
  water_access?: string;
  has_insurance?: boolean;
  adaptation_practices?: string[];
};

export const registerFarmer = createServerFn({ method: "POST" })
  .inputValidator((d: IntakeInput) => {
    if (!d.full_name?.trim()) throw new Error("Full name is required");
    if (!d.phone?.trim()) throw new Error("Phone number is required");
    if (!d.county?.trim()) throw new Error("County is required");
    return d;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Reuse if a profile with same phone already exists
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", data.phone)
      .maybeSingle();

    let farmerId = existing?.id as string | undefined;

    if (!farmerId) {
      const email = `farmer.${data.phone.replace(/\D/g, "")}@agritrust.local`;
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        phone: data.phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { full_name: data.full_name, account_type: "farmer" },
      });
      if (createErr || !created.user) throw createErr ?? new Error("Could not create farmer account");
      farmerId = created.user.id;
    }

    await supabaseAdmin.from("profiles").upsert({
      id: farmerId,
      full_name: data.full_name,
      phone: data.phone,
      account_type: "farmer",
      preferred_language: data.primary_language ?? "en",
    });

    const crops = [data.main_crop, ...(data.other_crops ?? [])].filter(Boolean) as string[];

    await supabaseAdmin.from("farmer_profiles").upsert({
      id: farmerId,
      county: data.county,
      sub_county: data.sub_county ?? null,
      ward: data.ward ?? null,
      national_id: data.national_id ?? null,
      date_of_birth: data.date_of_birth ?? null,
      gender: data.gender ?? null,
      has_disability: data.has_disability ?? false,
      primary_language: data.primary_language ?? "en",

      farm_size_acres: data.farm_size_acres ?? null,
      crops,
      livestock: data.livestock ?? [],
      years_farming: data.years_farming ?? null,
      land_ownership: data.land_ownership ?? null,
      irrigation: data.irrigation ?? false,
      main_buyers: data.main_buyers ?? [],
      input_suppliers: data.input_suppliers ?? [],

      uses_mobile_money: data.uses_mobile_money ?? false,
      mobile_money_provider: data.mobile_money_provider ?? null,
      savings_method: data.savings_method ?? null,
      cooperative: data.cooperative ?? null,
      coop_years: data.coop_years ?? null,

      primary_decision_maker: data.primary_decision_maker ?? null,
      controls_income: data.controls_income ?? null,
      owns_phone: data.owns_phone ?? true,
      in_women_group: data.in_women_group ?? false,
      in_youth_group: data.in_youth_group ?? false,
      in_disability_group: data.in_disability_group ?? false,
      faces_credit_barriers: data.faces_credit_barriers ?? false,
      inclusion_notes: data.inclusion_notes ?? null,

      climate_risks: data.climate_risks ?? [],
      water_access: data.water_access ?? null,
      has_insurance: data.has_insurance ?? false,
      adaptation_practices: data.adaptation_practices ?? [],

      intake_completed: true,
    });

    // Best-effort: seed Neo4j graph
    try {
      const { seedFarmerGraphById } = await import("./graph-admin.server");
      await seedFarmerGraphById(farmerId);
    } catch { /* graph unavailable */ }

    // Compute initial trust score
    try {
      const { computeTrustScoreFor } = await import("./trust-score.server");
      await computeTrustScoreFor(farmerId);
    } catch { /* fallback to defaults */ }

    return { farmerId };
  });

export const getFarmerById = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: fp }, { data: ts }, { data: records }, { data: loans }] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name, phone, preferred_language").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("farmer_profiles").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin.from("trust_scores").select("*").eq("farmer_id", data.id).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
      supabaseAdmin.from("farm_records").select("*").eq("farmer_id", data.id).order("occurred_on", { ascending: false }).limit(50),
      supabaseAdmin.from("loan_applications").select("*").eq("farmer_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (!profile && !fp) return null;
    return { id: data.id, profile, farmer: fp, trust: ts, records: records ?? [], loans: loans ?? [] };
  });

export const listFarmers = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: fps } = await supabaseAdmin
      .from("farmer_profiles")
      .select("id, county, gender, cooperative, crops, has_disability, is_youth, in_women_group, farm_size_acres")
      .order("updated_at", { ascending: false })
      .limit(200);
    const ids = (fps ?? []).map((r) => r.id);
    if (ids.length === 0) return [];
    const [{ data: profiles }, { data: scores }, { data: loans }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", ids),
      supabaseAdmin.from("trust_scores").select("farmer_id, score, climate_risk, loan_eligibility_kes, computed_at").in("farmer_id", ids).order("computed_at", { ascending: false }),
      supabaseAdmin.from("loan_applications").select("farmer_id, status").in("farmer_id", ids),
    ]);
    const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const sMap = new Map<string, { score: number; climate_risk: string; loan_eligibility_kes: number | null }>();
    for (const s of scores ?? []) if (!sMap.has(s.farmer_id)) sMap.set(s.farmer_id, s);
    const lMap = new Map<string, string>();
    for (const l of loans ?? []) if (!lMap.has(l.farmer_id)) lMap.set(l.farmer_id, l.status);

    return (fps ?? []).map((f) => ({
      id: f.id,
      name: pMap.get(f.id)?.full_name ?? "Farmer",
      phone: pMap.get(f.id)?.phone ?? null,
      county: f.county,
      crops: f.crops ?? [],
      gender: f.gender,
      cooperative: f.cooperative,
      is_youth: f.is_youth,
      has_disability: f.has_disability,
      in_women_group: f.in_women_group,
      farm_size_acres: f.farm_size_acres,
      trust_score: sMap.get(f.id)?.score ?? null,
      climate_risk: sMap.get(f.id)?.climate_risk ?? null,
      loan_eligibility_kes: sMap.get(f.id)?.loan_eligibility_kes ?? null,
      loan_status: lMap.get(f.id) ?? null,
    }));
  });
