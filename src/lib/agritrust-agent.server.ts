// Seller-side logic for the AgriTrust credit-intelligence agent.
// Assembles a tiered credit profile from Supabase + Neo4j, applies the
// Masumi-spec scoring weights, then asks an explainable AI reasoning step to
// produce a signed assessment (trust score, credit risk, recommended limit,
// confidence, risk explanation, positive/negative factors).

import { runQuery } from "@/lib/neo4j.server";
import type { MasumiTier } from "@/lib/masumi.server";

const MASUMI_WEIGHTS = {
  mobile_money: 0.25,
  coop: 0.25,
  repayment: 0.35,
  farm_data: 0.15,
} as const;

interface BuildArgs {
  farmerId: string;
  tier: MasumiTier;
}

export interface AgritrustAssessment {
  farmer_trust_score: number; // 0..100
  credit_risk_score: number; // 0..100 (higher = riskier)
  recommended_lending_limit_kes: number;
  confidence_level: number; // 0..1
  risk_explanation: string;
  positive_factors: string[];
  negative_factors: string[];
  reasoning_source: "lovable-ai" | "fallback";
}

export interface AgritrustProfile {
  farmer_id: string;
  tier: MasumiTier;
  masumi_trust_score: number;
  components: Record<string, number>;
  climate_penalty: number;
  recommendation: "approve" | "review" | "decline";
  assessment: AgritrustAssessment;
  identity?: { name: string; county: string | null };
  farm?: { size_acres: number | null; crops: string[]; cooperative: string | null };
  graph_signals?: { degree: number; coop_members: number; source: "neo4j" | "fallback" };
  generated_at: string;
}

async function loadNeoSignals(farmerId: string) {
  try {
    const rows = await runQuery<{ degree: number; coop_members: number }>(
      `MATCH (f:Farmer {id: $id})
       OPTIONAL MATCH (f)-[r]-()
       OPTIONAL MATCH (f)-[:MEMBER_OF]->(c:Cooperative)<-[:MEMBER_OF]-(peer:Farmer)
       RETURN count(DISTINCT r) AS degree, count(DISTINCT peer) AS coop_members`,
      { id: farmerId },
    );
    if (rows.length > 0) return { ...rows[0], source: "neo4j" as const };
  } catch {
    // fall through to fallback
  }
  return { degree: 3, coop_members: 8, source: "fallback" as const };
}

function fallbackAssessment(
  trustScore: number,
  components: Record<string, number>,
  farmSizeAcres: number | null,
): AgritrustAssessment {
  const riskScore = Math.max(0, Math.min(100, 100 - trustScore));
  const limit = Math.round(
    Math.max(
      10_000,
      Math.min(500_000, (trustScore / 100) * 250_000 + (farmSizeAcres ?? 1) * 15_000),
    ),
  );
  const positives: string[] = [];
  const negatives: string[] = [];
  if (components.repayment >= 60) positives.push("Consistent loan repayment history");
  else negatives.push("Limited or weak repayment history");
  if (components.mobile_money >= 60) positives.push("Active mobile-money cashflow");
  else negatives.push("Sparse mobile-money activity");
  if (components.coop >= 60) positives.push("Member of a verified cooperative");
  else negatives.push("Not yet anchored in a cooperative");
  if (components.farm_data >= 60) positives.push("Detailed farm records on file");
  else negatives.push("Thin farm-data footprint");

  return {
    farmer_trust_score: trustScore,
    credit_risk_score: riskScore,
    recommended_lending_limit_kes: limit,
    confidence_level: 0.6,
    risk_explanation:
      `Composite trust score is ${trustScore}/100, driven by repayment (${components.repayment}), ` +
      `cooperative (${components.coop}), mobile-money (${components.mobile_money}) and farm-data (${components.farm_data}) signals. ` +
      `Recommended limit reflects rules-based fallback because the AI reasoning step was unavailable.`,
    positive_factors: positives,
    negative_factors: negatives,
    reasoning_source: "fallback",
  };
}

async function reasonWithLovableAi(
  trustScore: number,
  components: Record<string, number>,
  context: {
    farmSizeAcres: number | null;
    cooperative: string | null;
    county: string | null;
    crops: string[];
    graphDegree: number | null;
    coopPeers: number | null;
  },
): Promise<AgritrustAssessment | null> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) return null;

  const schema = {
    type: "object",
    properties: {
      farmer_trust_score: { type: "number" },
      credit_risk_score: { type: "number" },
      recommended_lending_limit_kes: { type: "number" },
      confidence_level: { type: "number" },
      risk_explanation: { type: "string" },
      positive_factors: { type: "array", items: { type: "string" } },
      negative_factors: { type: "array", items: { type: "string" } },
    },
    required: [
      "farmer_trust_score",
      "credit_risk_score",
      "recommended_lending_limit_kes",
      "confidence_level",
      "risk_explanation",
      "positive_factors",
      "negative_factors",
    ],
    additionalProperties: false,
  };

  const prompt = `You are the AgriTrust credit-risk reasoning agent. A Kenyan smallholder farmer has these signals:
- Composite trust score (rule-based, 0-100): ${trustScore}
- Component scores: ${JSON.stringify(components)}
- Farm size (acres): ${context.farmSizeAcres ?? "unknown"}
- County: ${context.county ?? "unknown"}
- Cooperative: ${context.cooperative ?? "none"}
- Crops: ${context.crops.join(", ") || "unknown"}
- Neo4j graph degree: ${context.graphDegree ?? "unknown"}, cooperative peers: ${context.coopPeers ?? "unknown"}

Return a JSON object with:
- farmer_trust_score (0-100, may refine the composite)
- credit_risk_score (0-100, 100 = highest risk)
- recommended_lending_limit_kes (whole KES, between 10000 and 500000)
- confidence_level (0..1)
- risk_explanation (3-5 plain-language sentences a loan officer can read aloud)
- positive_factors (max 5 short bullets)
- negative_factors (max 5 short bullets)
Never penalise gender, age, disability or land ownership.`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an explainable agricultural credit-risk analyst. Respond using the provided function only." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "submit_assessment",
              description: "Return the structured credit assessment.",
              parameters: schema,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "submit_assessment" } },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const args = json.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    const parsed = JSON.parse(args);
    return {
      farmer_trust_score: Math.round(Number(parsed.farmer_trust_score) || trustScore),
      credit_risk_score: Math.round(Number(parsed.credit_risk_score) || 100 - trustScore),
      recommended_lending_limit_kes: Math.round(Number(parsed.recommended_lending_limit_kes) || 0),
      confidence_level: Math.max(0, Math.min(1, Number(parsed.confidence_level) || 0.6)),
      risk_explanation: String(parsed.risk_explanation || ""),
      positive_factors: Array.isArray(parsed.positive_factors) ? parsed.positive_factors.slice(0, 5).map(String) : [],
      negative_factors: Array.isArray(parsed.negative_factors) ? parsed.negative_factors.slice(0, 5).map(String) : [],
      reasoning_source: "lovable-ai",
    };
  } catch {
    return null;
  }
}

export async function buildAgritrustProfile(
  args: BuildArgs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
): Promise<AgritrustProfile> {
  const [{ data: profile }, { data: farmer }, { data: loansRows }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", args.farmerId).maybeSingle(),
    supabase.from("farmer_profiles").select("*").eq("id", args.farmerId).maybeSingle(),
    supabase.from("loan_applications").select("status").eq("farmer_id", args.farmerId),
  ]);

  const loans = (loansRows ?? []) as Array<{ status: string }>;
  const total = loans.length || 1;
  const repaid = loans.filter((l) => l.status === "repaid").length;

  const farmerObj = farmer as {
    county?: string;
    farm_size_acres?: number;
    crops?: string[];
    cooperative?: string;
    mobile_money_provider?: string;
  } | null;
  const profileObj = profile as { full_name?: string } | null;

  const components = {
    mobile_money: farmerObj?.mobile_money_provider ? 80 : 35,
    coop: farmerObj?.cooperative ? 85 : 45,
    repayment: Math.min(100, Math.round((repaid / Math.max(1, total)) * 100)),
    farm_data: farmerObj?.farm_size_acres ? 75 : 40,
  };

  const climate_penalty = 0;
  const masumi_trust_score = Math.max(
    0,
    Math.round(
      components.mobile_money * MASUMI_WEIGHTS.mobile_money +
        components.coop * MASUMI_WEIGHTS.coop +
        components.repayment * MASUMI_WEIGHTS.repayment +
        components.farm_data * MASUMI_WEIGHTS.farm_data -
        climate_penalty,
    ),
  );

  // Always load graph signals for the reasoner; only expose in premium tier.
  const graph = await loadNeoSignals(args.farmerId);

  const aiAssessment = await reasonWithLovableAi(masumi_trust_score, components, {
    farmSizeAcres: farmerObj?.farm_size_acres ?? null,
    cooperative: farmerObj?.cooperative ?? null,
    county: farmerObj?.county ?? null,
    crops: farmerObj?.crops ?? [],
    graphDegree: graph.degree,
    coopPeers: graph.coop_members,
  });
  const assessment =
    aiAssessment ?? fallbackAssessment(masumi_trust_score, components, farmerObj?.farm_size_acres ?? null);

  const recommendation: "approve" | "review" | "decline" =
    assessment.farmer_trust_score >= 70
      ? "approve"
      : assessment.farmer_trust_score >= 50
      ? "review"
      : "decline";

  const result: AgritrustProfile = {
    farmer_id: args.farmerId,
    tier: args.tier,
    masumi_trust_score: assessment.farmer_trust_score,
    components,
    climate_penalty,
    recommendation,
    assessment,
    generated_at: new Date().toISOString(),
  };

  if (args.tier === "basic") return result;

  result.identity = { name: profileObj?.full_name ?? "Farmer", county: farmerObj?.county ?? null };
  result.farm = {
    size_acres: farmerObj?.farm_size_acres ?? null,
    crops: farmerObj?.crops ?? [],
    cooperative: farmerObj?.cooperative ?? null,
  };

  if (args.tier === "standard") return result;

  result.graph_signals = graph;
  return result;
}
