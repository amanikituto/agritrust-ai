import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Weights per plan defaults
const W = { behavior: 0.25, financial: 0.20, community: 0.15, agricultural: 0.15, climate: 0.15, digital: 0.10 };

export const computeMyTrustScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: fp } = await context.supabase.from("farmer_profiles").select("*").eq("user_id", context.userId).maybeSingle();
    const { data: loans } = await context.supabase.from("loan_applications").select("status, amount").eq("farmer_id", context.userId);

    const repaid = (loans ?? []).filter((l) => l.status === "closed").length;
    const declined = (loans ?? []).filter((l) => l.status === "declined").length;
    const total = (loans ?? []).length || 1;

    const behavior = Math.min(1, repaid / Math.max(1, total)) * 100;
    const financial = fp?.monthly_income_kes ? Math.min(100, Number(fp.monthly_income_kes) / 500) : 55;
    const community = fp?.cooperative_member ? 80 : 45;
    const agricultural = fp?.farm_size_acres ? Math.min(100, Number(fp.farm_size_acres) * 8) : 50;
    const climate = 70; // would derive from climate cache
    const digital = fp?.phone ? 75 : 40;

    const composite = Math.round(
      behavior * W.behavior + financial * W.financial + community * W.community +
      agricultural * W.agricultural + climate * W.climate + digital * W.digital,
    );
    const score = 300 + Math.round((composite / 100) * 550); // map 0-100 → 300-850

    const factors_positive = [
      repaid > 0 && { name: "Repayment history", impact: 0.22 },
      fp?.cooperative_member && { name: "Cooperative member", impact: 0.18 },
      fp?.farm_size_acres && { name: "Active farmland", impact: 0.12 },
    ].filter(Boolean);
    const factors_negative = [
      declined > 0 && { name: "Past declines", impact: -0.10 },
      !fp?.cooperative_member && { name: "No cooperative", impact: -0.08 },
    ].filter(Boolean);

    const { data, error } = await context.supabase.from("trust_scores").insert({
      user_id: context.userId,
      score,
      behavior_score: behavior,
      financial_score: financial,
      community_score: community,
      agricultural_score: agricultural,
      climate_score: climate,
      digital_score: digital,
      factors_positive,
      factors_negative,
    }).select().single();
    if (error) throw error;
    return data;
  });
