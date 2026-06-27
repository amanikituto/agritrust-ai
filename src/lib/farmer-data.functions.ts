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
  .inputValidator((d: {
    full_name?: string; phone?: string;
    county?: string; sub_county?: string; ward?: string;
    cooperative?: string; farm_size_acres?: number;
    mobile_money_provider?: string; crops?: string[];
  }) => d)
  .handler(async ({ data, context }) => {
    if (data.full_name || data.phone) {
      await context.supabase.from("profiles").update({
        full_name: data.full_name, phone: data.phone,
      }).eq("id", context.userId);
    }
    const farmerFields = {
      id: context.userId,
      county: data.county,
      sub_county: data.sub_county,
      ward: data.ward,
      cooperative: data.cooperative,
      farm_size_acres: data.farm_size_acres,
      mobile_money_provider: data.mobile_money_provider,
      crops: data.crops,
    };
    await context.supabase.from("farmer_profiles").upsert(farmerFields);
    return { ok: true };
  });

export const listFarmersDirectory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: farmers } = await context.supabase
      .from("farmer_profiles")
      .select("id, county, cooperative, gender, has_disability, farm_size_acres, crops")
      .limit(200);
    const ids = (farmers ?? []).map((f) => f.id);
    if (ids.length === 0) return [];
    const [{ data: profiles }, { data: scores }] = await Promise.all([
      context.supabase.from("profiles").select("id, full_name, email").in("id", ids),
      context.supabase.from("trust_scores").select("farmer_id, score, climate_risk, computed_at").in("farmer_id", ids).order("computed_at", { ascending: false }),
    ]);
    const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const sMap = new Map<string, { score: number; climate_risk: string }>();
    for (const s of scores ?? []) if (!sMap.has(s.farmer_id)) sMap.set(s.farmer_id, { score: s.score, climate_risk: s.climate_risk });
    return (farmers ?? []).map((f) => ({
      ...f,
      name: pMap.get(f.id)?.full_name ?? "Farmer",
      email: pMap.get(f.id)?.email ?? null,
      score: sMap.get(f.id)?.score ?? null,
      climate_risk: sMap.get(f.id)?.climate_risk ?? null,
    }));
  });

export const getFarmerDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const [{ data: profile }, { data: farmer }, { data: ts }, { data: loans }] = await Promise.all([
      context.supabase.from("profiles").select("full_name, email, phone").eq("id", data.id).maybeSingle(),
      context.supabase.from("farmer_profiles").select("*").eq("id", data.id).maybeSingle(),
      context.supabase.from("trust_scores").select("*").eq("farmer_id", data.id).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
      context.supabase.from("loan_applications").select("id, amount_kes, status, created_at").eq("farmer_id", data.id).order("created_at", { ascending: false }).limit(10),
    ]);
    return { profile, farmer, trust: ts, loans: loans ?? [] };
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
