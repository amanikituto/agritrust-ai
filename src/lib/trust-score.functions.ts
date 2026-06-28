import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * AFRACA-aligned weights. Inclusion attributes (gender, age, disability,
 * land ownership) are EXPLICITLY excluded from negative scoring — they
 * only enrich the lender's context and may trigger inclusive recommendations.
 */
const WEIGHTS = {
  repayment: 0.25,
  cooperative: 0.15,
  production: 0.15,
  mobile_money: 0.10,
  savings: 0.10,
  inputs: 0.10,
  training: 0.05,
  climate_resilience: 0.05,
  insurance: 0.05,
  community: 0.05,
} as const;

type Components = Record<keyof typeof WEIGHTS, number>;

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function countBy(records: { record_type: string }[], type: string) {
  return records.filter((r) => r.record_type === type).length;
}

export const computeMyTrustScore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: fp }, { data: loans }, { data: records }, { data: profile }] = await Promise.all([
      context.supabase.from("farmer_profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("loan_applications").select("status").eq("farmer_id", context.userId),
      context.supabase.from("farm_records").select("record_type, amount_kes, occurred_on").eq("farmer_id", context.userId),
      context.supabase.from("profiles").select("full_name").eq("id", context.userId).maybeSingle(),
    ]);

    const recs = records ?? [];
    const allLoans = loans ?? [];
    const repaid = allLoans.filter((l) => l.status === "repaid").length;
    const declined = allLoans.filter((l) => l.status === "rejected").length;
    const totalLoans = allLoans.length;

    // Component scores 0-100. Missing data → neutral 50 (graceful degradation).
    const repayHistoryRecords = countBy(recs, "repayment");
    const components: Components = {
      repayment: totalLoans
        ? clamp((repaid / totalLoans) * 100 + Math.min(20, repayHistoryRecords * 4))
        : repayHistoryRecords > 0
          ? clamp(50 + repayHistoryRecords * 6)
          : 50,
      cooperative: fp?.cooperative
        ? clamp(60 + (fp.coop_years ?? 0) * 4 + (fp.peer_guarantee ? 10 : 0) + (fp.coop_role ? 8 : 0))
        : 45,
      production: fp?.farm_size_acres
        ? clamp(40 + Number(fp.farm_size_acres) * 6 + countBy(recs, "harvest") * 5 + countBy(recs, "planting") * 3)
        : 50,
      mobile_money: fp?.uses_mobile_money
        ? clamp(70 + countBy(recs, "sale") * 2)
        : fp?.mobile_money_provider
          ? 65
          : 40,
      savings: fp?.savings_method
        ? clamp(60 + countBy(recs, "savings_deposit") * 5)
        : countBy(recs, "savings_deposit") > 0
          ? clamp(50 + countBy(recs, "savings_deposit") * 5)
          : 45,
      inputs: clamp(50 + countBy(recs, "input_purchase") * 6 + ((fp?.input_suppliers?.length ?? 0) > 0 ? 10 : 0)),
      training: clamp(50 + countBy(recs, "training") * 8 + countBy(recs, "extension_visit") * 4 + ((fp?.extension_visits_per_year ?? 0) > 0 ? 10 : 0)),
      climate_resilience: clamp(
        50 +
          (fp?.irrigation ? 12 : 0) +
          ((fp?.adaptation_practices?.length ?? 0) * 5) +
          (fp?.water_access === "reliable" ? 8 : 0) -
          countBy(recs, "weather_damage") * 3,
      ),
      insurance: fp?.has_insurance ? 85 : countBy(recs, "insurance") > 0 ? 70 : 40,
      community: clamp(
        50 +
          (fp?.cooperative ? 10 : 0) +
          (fp?.peer_guarantee ? 10 : 0) +
          ((fp?.in_women_group || fp?.in_youth_group || fp?.in_disability_group) ? 8 : 0),
      ),
    };

    // Composite (0-100) — inclusion attrs intentionally absent from this math.
    const composite = Math.round(
      Object.entries(WEIGHTS).reduce((acc, [k, w]) => acc + components[k as keyof Components] * w, 0),
    );

    const positives: string[] = [];
    const negatives: string[] = [];
    if (components.repayment >= 70) positives.push("Consistent loan repayment history");
    if (components.cooperative >= 70) positives.push(`Active cooperative member${fp?.coop_role ? ` (${fp.coop_role})` : ""}`);
    if (components.mobile_money >= 70) positives.push("Regular mobile money activity");
    if (components.production >= 70) positives.push("Strong production records");
    if (components.training >= 65) positives.push("Engaged with training & extension officers");
    if (components.insurance >= 70) positives.push("Crop or livestock insurance in place");
    if (components.climate_resilience >= 70) positives.push("Climate adaptation practices");

    if (components.repayment < 50) negatives.push("Limited repayment evidence on record");
    if (components.mobile_money < 50) negatives.push("Low digital transaction footprint");
    if (components.climate_resilience < 50) negatives.push("Elevated climate exposure / drought risk");
    if (declined > 0) negatives.push(`${declined} prior loan${declined === 1 ? "" : "s"} declined`);

    const recommendations: string[] = [];
    if (components.insurance < 70) recommendations.push("Add crop or livestock insurance to strengthen resilience");
    if (components.training < 60) recommendations.push("Attend a cooperative training session or schedule an extension visit");
    if (components.mobile_money < 60) recommendations.push("Use M-Pesa for input purchases and sales to build a digital footprint");
    if (components.savings < 60) recommendations.push("Make a small monthly savings deposit through your cooperative");

    const climate_risk = components.climate_resilience >= 70 ? "low" : components.climate_resilience >= 50 ? "medium" : "high";
    const credit_readiness = Math.min(100, Math.round(composite * 0.95));
    const loan_eligibility_kes = Math.round(composite * 1500);

    const narrative =
      `${profile?.full_name ?? "This farmer"} has a Trust Score of ${composite}/100. ` +
      (positives.length ? `Strengths: ${positives.slice(0, 3).join(", ")}. ` : "") +
      (negatives.length ? `Areas of attention: ${negatives.slice(0, 2).join(", ")}. ` : "") +
      `Climate risk is ${climate_risk}. Recommended loan ceiling: KES ${loan_eligibility_kes.toLocaleString()}.`;

    const { data, error } = await context.supabase.from("trust_scores").insert({
      farmer_id: context.userId,
      score: composite,
      credit_readiness,
      climate_risk,
      loan_eligibility_kes,
      components: { ...components, weights: WEIGHTS, narrative },
      top_positive_factors: positives,
      top_negative_factors: negatives,
      recommendations,
    }).select().single();
    if (error) throw error;

    await context.supabase.from("audit_events").insert({
      actor_id: context.userId,
      action: "trust_score.computed",
      entity_type: "trust_score",
      entity_id: data.id,
      metadata: { composite, components },
    });

    return data;
  });
