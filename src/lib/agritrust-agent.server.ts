// Seller-side logic for the AgriTrust credit-intelligence agent.
// Assembles a tiered credit profile from Supabase + Neo4j, using the
// Masumi-spec scoring weights.

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

export interface AgritrustProfile {
  farmer_id: string;
  tier: MasumiTier;
  masumi_trust_score: number;
  components: Record<string, number>;
  climate_penalty: number;
  recommendation: "approve" | "review" | "decline";
  // tier-graded payload
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

  const components = {
    mobile_money: (farmer as Record<string, unknown> | null)?.mobile_money_provider ? 80 : 35,
    coop: (farmer as Record<string, unknown> | null)?.cooperative ? 85 : 45,
    repayment: Math.min(100, Math.round((repaid / Math.max(1, total)) * 100)),
    farm_data: (farmer as Record<string, unknown> | null)?.farm_size_acres ? 75 : 40,
  };

  const climate_penalty = 0; // computed via outbound climate agent in /invoke
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
  const recommendation: "approve" | "review" | "decline" =
    masumi_trust_score >= 70 ? "approve" : masumi_trust_score >= 50 ? "review" : "decline";

  const profileObj = profile as { full_name?: string } | null;
  const farmerObj = farmer as {
    county?: string;
    farm_size_acres?: number;
    crops?: string[];
    cooperative?: string;
  } | null;

  const result: AgritrustProfile = {
    farmer_id: args.farmerId,
    tier: args.tier,
    masumi_trust_score,
    components,
    climate_penalty,
    recommendation,
    generated_at: new Date().toISOString(),
  };

  if (args.tier === "basic") return result;

  // standard tier adds identity + farm summary
  result.identity = { name: profileObj?.full_name ?? "Farmer", county: farmerObj?.county ?? null };
  result.farm = {
    size_acres: farmerObj?.farm_size_acres ?? null,
    crops: farmerObj?.crops ?? [],
    cooperative: farmerObj?.cooperative ?? null,
  };

  if (args.tier === "standard") return result;

  // premium tier adds neo4j relationship signals
  result.graph_signals = await loadNeoSignals(args.farmerId);
  return result;
}
