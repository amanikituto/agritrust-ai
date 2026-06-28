import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyTrustScore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("trust_scores")
      .select("*")
      .eq("farmer_id", context.userId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: farmer }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("farmer_profiles").select("*").eq("id", context.userId).maybeSingle(),
    ]);
    return { profile, farmer };
  });

export const updateFarmerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async ({ data, context }) => {
    if (data.full_name || data.phone) {
      await context.supabase.from("profiles").update({
        full_name: data.full_name as string | undefined,
        phone: data.phone as string | undefined,
      }).eq("id", context.userId);
    }
    const { full_name: _fn, phone: _ph, ...farmerFields } = data;
    await context.supabase.from("farmer_profiles").upsert({ id: context.userId, ...farmerFields });
    return { ok: true };
  });

/**
 * Save the multi-step farmer intake. Stores everything on
 * profiles + farmer_profiles, records consent, marks intake completed,
 * then seeds the graph and recomputes the trust score.
 *
 * IMPORTANT: gender / age / disability / land ownership are stored for
 * context only and never used as negative scoring inputs.
 */
export const saveFarmerIntake = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Record<string, unknown>) => d)
  .handler(async ({ data, context }) => {
    const { full_name, phone, consent_data_use, ...rest } = data as Record<string, unknown>;
    if (!consent_data_use) throw new Error("Consent is required to save your intake.");

    if (full_name || phone) {
      await context.supabase.from("profiles").update({
        full_name: full_name as string | undefined,
        phone: phone as string | undefined,
      }).eq("id", context.userId);
    }
    const { error } = await context.supabase.from("farmer_profiles").upsert({
      id: context.userId,
      ...rest,
      consent_data_use: true,
      consent_at: new Date().toISOString(),
      intake_completed: true,
    });
    if (error) throw error;

    // Best-effort side effects.
    try {
      const { seedFarmerGraph } = await import("./graph.functions");
      await seedFarmerGraph({ data: { farmerId: context.userId } });
    } catch { /* no-op */ }
    try {
      const { computeMyTrustScore } = await import("./trust-score.functions");
      await computeMyTrustScore();
    } catch { /* no-op */ }

    return { ok: true };
  });

export const listFarmersDirectory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profiles } = await context.supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("account_type", "farmer")
      .limit(500);
    const ids = (profiles ?? []).map((p) => p.id);
    if (ids.length === 0) return [];
    const [{ data: farmers }, { data: scores }] = await Promise.all([
      context.supabase
        .from("farmer_profiles")
        .select("id, county, cooperative, gender, has_disability, is_youth, in_women_group, in_youth_group, in_disability_group, farm_size_acres, crops, uses_mobile_money")
        .in("id", ids),
      context.supabase
        .from("trust_scores")
        .select("farmer_id, score, climate_risk, credit_readiness, computed_at")
        .in("farmer_id", ids)
        .order("computed_at", { ascending: false }),
    ]);
    const fMap = new Map((farmers ?? []).map((f) => [f.id, f]));
    const sMap = new Map<string, { score: number; climate_risk: string; credit_readiness: number }>();
    for (const s of scores ?? []) {
      if (!sMap.has(s.farmer_id)) {
        sMap.set(s.farmer_id, { score: s.score, climate_risk: s.climate_risk, credit_readiness: s.credit_readiness });
      }
    }
    return (profiles ?? []).map((p) => {
      const f = fMap.get(p.id);
      const s = sMap.get(p.id);
      return {
        id: p.id,
        name: p.full_name ?? "Farmer",
        email: p.email ?? null,
        county: f?.county ?? null,
        cooperative: f?.cooperative ?? null,
        gender: f?.gender ?? null,
        has_disability: f?.has_disability ?? false,
        is_youth: f?.is_youth ?? false,
        in_women_group: f?.in_women_group ?? false,
        uses_mobile_money: f?.uses_mobile_money ?? false,
        farm_size_acres: f?.farm_size_acres ?? null,
        crops: f?.crops ?? [],
        score: s?.score ?? null,
        credit_readiness: s?.credit_readiness ?? null,
        climate_risk: s?.climate_risk ?? null,
        onboarded: !!f?.county,
      };
    });
  });

export const getFarmerDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const [{ data: profile }, { data: farmer }, { data: ts }, { data: scoreHistory }, { data: loans }, { data: records }] = await Promise.all([
      context.supabase.from("profiles").select("full_name, email, phone").eq("id", data.id).maybeSingle(),
      context.supabase.from("farmer_profiles").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("trust_scores").select("*").eq("farmer_id", data.id).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
      context.supabase.from("trust_scores").select("score, computed_at").eq("farmer_id", data.id).order("computed_at", { ascending: true }).limit(12),
      context.supabase.from("loan_applications").select("id, amount_kes, status, source, created_at").eq("farmer_id", data.id).order("created_at", { ascending: false }).limit(10),
      context.supabase.from("farm_records").select("record_type, amount_kes, counterparty, occurred_on").eq("farmer_id", data.id).order("occurred_on", { ascending: false }).limit(20),
    ]);
    return { profile, farmer, trust: ts, trustHistory: scoreHistory ?? [], loans: loans ?? [], records: records ?? [] };
  });

export const myNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });
