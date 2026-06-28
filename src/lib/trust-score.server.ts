// Trust score engine — transparent 100-point composite.
// Weights from the AgriTrust spec. Protected characteristics (gender, age,
// disability, land ownership) are NEVER inputs to the score.
const WEIGHTS = {
  repayment: 25,
  cooperative: 15,
  farm_records: 15,
  mobile_money: 10,
  savings: 10,
  input_purchases: 10,
  training: 5,
  climate_resilience: 5,
  insurance: 5,
} as const;

type Comp = Record<keyof typeof WEIGHTS, number>;

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

function countBy(records: { record_type: string }[], t: string) {
  return records.filter((r) => r.record_type === t).length;
}

export interface ScoreResult {
  score: number;
  components: Comp;
  climate_risk: "low" | "medium" | "high";
  credit_readiness: number;
  loan_eligibility_kes: number;
  positives: string[];
  negatives: string[];
  recommendations: string[];
  explanation: string;
}

export function calculateScore(
  fp: Record<string, unknown> | null,
  records: { record_type: string }[],
  loans: { status: string }[],
  name = "This farmer",
): ScoreResult {
  const recs = records ?? [];
  const totalLoans = loans.length;
  const repaid = loans.filter((l) => l.status === "repaid").length;
  const rejected = loans.filter((l) => l.status === "rejected").length;
  const f = (fp ?? {}) as Record<string, unknown>;

  const repayRecordCount = countBy(recs, "repayment");

  const components: Comp = {
    repayment: totalLoans
      ? clamp((repaid / totalLoans) * 100 + repayRecordCount * 5)
      : repayRecordCount > 0
        ? clamp(55 + repayRecordCount * 8)
        : 50,
    cooperative: f.cooperative
      ? clamp(65 + Number(f.coop_years ?? 0) * 4 + (f.peer_guarantee ? 8 : 0))
      : 40,
    farm_records: clamp(40 + recs.length * 3),
    mobile_money: f.uses_mobile_money
      ? clamp(75 + countBy(recs, "sale") * 2)
      : f.mobile_money_provider ? 60 : 35,
    savings: f.savings_method ? clamp(60 + countBy(recs, "savings_deposit") * 5) : 40,
    input_purchases: clamp(45 + countBy(recs, "input_purchase") * 7 + (((f.input_suppliers as string[] | undefined)?.length ?? 0) > 0 ? 10 : 0)),
    training: clamp(45 + countBy(recs, "training") * 10 + countBy(recs, "extension_visit") * 6),
    climate_resilience: clamp(
      50 +
      (f.irrigation ? 15 : 0) +
      ((f.adaptation_practices as string[] | undefined)?.length ?? 0) * 6 +
      (f.water_access === "reliable" ? 10 : 0) -
      countBy(recs, "weather_damage") * 4,
    ),
    insurance: f.has_insurance ? 90 : countBy(recs, "insurance") > 0 ? 70 : 35,
  };

  const score = Math.round(
    (Object.keys(WEIGHTS) as (keyof Comp)[]).reduce(
      (a, k) => a + (components[k] * WEIGHTS[k]) / 100,
      0,
    ),
  );

  const climate_risk =
    components.climate_resilience >= 70 ? "low" : components.climate_resilience >= 50 ? "medium" : "high";

  const positives: string[] = [];
  const negatives: string[] = [];
  if (components.repayment >= 70) positives.push("Strong repayment record");
  if (components.cooperative >= 70) positives.push(`Active cooperative member${f.cooperative ? ` (${f.cooperative})` : ""}`);
  if (components.mobile_money >= 70) positives.push("Active mobile-money cashflow");
  if (components.farm_records >= 65) positives.push("Detailed farm records on file");
  if (components.training >= 60) positives.push("Engaged with training & extension");
  if (components.insurance >= 70) positives.push("Crop or livestock insurance in place");

  if (components.repayment < 50) negatives.push("Limited repayment evidence");
  if (components.mobile_money < 50) negatives.push("Low digital transaction footprint");
  if (components.farm_records < 50) negatives.push("Few farm records on file");
  if (components.climate_resilience < 50) negatives.push("High climate exposure");
  if (rejected > 0) negatives.push(`${rejected} prior loan${rejected === 1 ? "" : "s"} declined`);

  const recommendations: string[] = [];
  if (components.insurance < 70) recommendations.push("Add crop or livestock insurance");
  if (components.training < 60) recommendations.push("Attend a cooperative training session");
  if (components.mobile_money < 60) recommendations.push("Use M-Pesa for sales and input purchases");
  if (components.savings < 60) recommendations.push("Make small monthly savings deposits");
  if (components.farm_records < 60) recommendations.push("Log harvests and sales weekly");

  const credit_readiness = clamp(score * 0.95);
  const loan_eligibility_kes = Math.round(score * 1500);

  const band = score >= 80 ? "Low Risk" : score >= 60 ? "Moderate Risk" : score >= 40 ? "High Risk" : "Needs More Data";
  const explanation =
    `${name} has a Trust Score of ${score}/100 (${band}). ` +
    (positives.length ? `Strengths: ${positives.slice(0, 3).join(", ")}. ` : "") +
    (negatives.length ? `Watch-outs: ${negatives.slice(0, 2).join(", ")}. ` : "") +
    `Climate risk is ${climate_risk}. Recommended loan ceiling: KES ${loan_eligibility_kes.toLocaleString()}.`;

  return { score, components, climate_risk, credit_readiness, loan_eligibility_kes, positives, negatives, recommendations, explanation };
}

export async function computeTrustScoreFor(farmerId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: fp }, { data: loans }, { data: records }, { data: profile }] = await Promise.all([
    supabaseAdmin.from("farmer_profiles").select("*").eq("id", farmerId).maybeSingle(),
    supabaseAdmin.from("loan_applications").select("status").eq("farmer_id", farmerId),
    supabaseAdmin.from("farm_records").select("record_type").eq("farmer_id", farmerId),
    supabaseAdmin.from("profiles").select("full_name").eq("id", farmerId).maybeSingle(),
  ]);

  const r = calculateScore(fp ?? null, records ?? [], loans ?? [], profile?.full_name ?? "This farmer");

  const { data, error } = await supabaseAdmin.from("trust_scores").insert({
    farmer_id: farmerId,
    score: r.score,
    credit_readiness: r.credit_readiness,
    climate_risk: r.climate_risk,
    loan_eligibility_kes: r.loan_eligibility_kes,
    components: { ...r.components, weights: WEIGHTS, narrative: r.explanation },
    top_positive_factors: r.positives,
    top_negative_factors: r.negatives,
    recommendations: r.recommendations,
  }).select().single();
  if (error) throw error;
  return data;
}
