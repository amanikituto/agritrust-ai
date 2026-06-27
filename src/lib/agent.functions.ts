import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getAgritrustAgentInfo,
  masumiPricing,
  payAndInvoke,
  payOutboundClimateAgent,
  signReceipt,
  type MasumiTier,
} from "@/lib/masumi.server";
import { buildAgritrustProfile } from "@/lib/agritrust-agent.server";

export const lenderRequestFarmerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { farmerId: string; tier: MasumiTier }) => {
    if (!d.farmerId || typeof d.farmerId !== "string") throw new Error("farmerId required");
    if (!["basic", "standard", "premium"].includes(d.tier)) throw new Error("invalid tier");
    return d;
  })
  .handler(async ({ data, context }) => {
    // 1. Verify caller is lender staff (RPC on existing security-definer fn)
    const { data: isLender } = await context.supabase.rpc("is_lender_staff", {
      _user_id: context.userId,
    });
    if (!isLender) throw new Error("Only lender staff can call the AgriTrust agent");

    // 2. Resolve agent (mocked discovery — in production this hits Masumi registry)
    const agent = getAgritrustAgentInfo("https://agritrust.lovable.app");

    // 3. Pay & invoke (lender -> agritrust)
    const invocation = await payAndInvoke({ agentId: agent.agentId, tier: data.tier });

    // 4. Build the credit profile (this is what the AgriTrust agent returns)
    const profile = await buildAgritrustProfile({ farmerId: data.farmerId, tier: data.tier }, context.supabase);

    // 5. Outbound agent-to-agent call: AgriTrust pays Climate Agent (second tx)
    const climate = await payOutboundClimateAgent();

    // 6. Sign receipt
    const receipt = {
      jobId: invocation.jobId,
      farmerId: data.farmerId,
      tier: data.tier,
      score: profile.masumi_trust_score,
      issuedAt: new Date().toISOString(),
    };
    const signature = signReceipt(receipt);

    // 7. Record the job (RLS lets lender staff read it later)
    await context.supabase.from("agent_jobs").insert({
      buyer_id: context.userId,
      farmer_id: data.farmerId,
      tier: data.tier,
      amount_kes: invocation.amountKes,
      masumi_job_id: invocation.jobId,
      escrow_tx: invocation.escrowTx,
      explorer_url: invocation.explorerUrl,
      outbound_tx: climate.tx,
      outbound_explorer_url: climate.explorerUrl,
      is_mocked: invocation.isMocked,
      result: profile as unknown as never,
    });

    return { invocation, profile, climate, receipt, signature, agent };
  });

export const listAgentInfo = createServerFn({ method: "GET" }).handler(async () => {
  return {
    agent: getAgritrustAgentInfo("https://agritrust.lovable.app"),
    pricing: masumiPricing(),
  };
});

export const listMyAgentJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("agent_jobs")
      .select("id, farmer_id, tier, amount_kes, masumi_job_id, escrow_tx, explorer_url, outbound_tx, outbound_explorer_url, is_mocked, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const getExistingAgentJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { farmerId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("agent_jobs")
      .select("id, farmer_id, tier, amount_kes, masumi_job_id, escrow_tx, explorer_url, outbound_tx, outbound_explorer_url, is_mocked, result, created_at")
      .eq("buyer_id", context.userId)
      .eq("farmer_id", data.farmerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return row ?? null;
  });

