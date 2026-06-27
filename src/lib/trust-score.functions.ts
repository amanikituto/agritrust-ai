import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const W = { behavior: 0.25, financial: 0.20, community: 0.15, agricultural: 0.15, climate: 0.15, digital: 0.10 };

export const computeMyTrustScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: fp } = await context.supabase.from("farmer_profiles").select("*").eq("id", context.userId).maybeSingle();
    const { data: loans } = await context.supabase.from("loan_applications").select("status, amount_kes").eq("farmer_id", context.userId);

    const repaid = (loans ?? []).filter((l) => l.status === "closed").length;
    const declined = (loans ?? []).filter((l) => l.status === "declined").length;
    const total = (loans ?? []).length || 1;

    const behavior = Math.min(1, repaid / Math.max(1, total)) * 100;
    const financial = 55;
    const community = fp?.cooperative ? 80 : 45;
    const agricultural = fp?.farm_size_acres ? Math.min(100, Number(fp.farm_size_acres) * 8) : 50;
    const climate = 70;
    const digital = fp?.mobile_money_provider ? 75 : 40;

    const composite = Math.round(
      behavior * W.behavior + financial * W.financial + community * W.community +
      agricultural * W.agricultural + climate * W.climate + digital * W.digital,
    );

    const positives: string[] = [];
    if (repaid > 0) positives.push("Strong repayment history");
    if (fp?.cooperative) positives.push("Active cooperative member");
    if (fp?.farm_size_acres) positives.push("Active farmland");
    const negatives: string[] = [];
    if (declined > 0) negatives.push("Past loan declines");
    if (!fp?.cooperative) negatives.push("No cooperative membership");

    const credit_readiness = Math.min(100, Math.round(composite * 0.95));
    const climate_risk = climate > 70 ? "low" : climate > 50 ? "medium" : "high";
    const loan_eligibility_kes = Math.round(composite * 1500);

    const { data, error } = await context.supabase.from("trust_scores").insert({
      farmer_id: context.userId,
      score: composite,
      credit_readiness,
      climate_risk,
      loan_eligibility_kes,
      components: { behavior, financial, community, agricultural, climate, digital, weights: W },
      top_positive_factors: positives,
      top_negative_factors: negatives,
      recommendations: [
        "Add crop insurance to improve risk profile",
        "Maintain on-time mobile-money transactions",
      ],
    }).select().single();
    if (error) throw error;
    return data;
  });
