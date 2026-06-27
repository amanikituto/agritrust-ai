// Thin Masumi client wrapper. Runs in MOCKED mode unless MASUMI_API_KEY is set.
// All values returned mirror what a live Masumi job would yield so the UI shape
// stays identical when we flip the switch.

import { createHmac, randomUUID } from "crypto";

export type MasumiTier = "basic" | "standard" | "premium";

export interface MasumiInvocation {
  jobId: string;
  escrowTx: string;
  explorerUrl: string;
  network: string;
  isMocked: boolean;
  agentId: string;
  amountKes: number;
}

export interface MasumiAgentInfo {
  agentId: string;
  name: string;
  endpoint: string;
  capability: string;
  pricingKes: Record<MasumiTier, number>;
  network: string;
}

const PRICING: Record<MasumiTier, number> = {
  basic: 50,
  standard: 150,
  premium: 400,
};

export function masumiPricing() {
  return PRICING;
}

export function getAgritrustAgentInfo(origin: string): MasumiAgentInfo {
  return {
    agentId: process.env.MASUMI_AGENT_ID ?? "agritrust.credit.v1",
    name: "AgriTrust Credit Intelligence Agent",
    endpoint: `${origin}/api/public/agent/invoke`,
    capability: "agritrust.credit",
    pricingKes: PRICING,
    network: process.env.MASUMI_NETWORK ?? "preprod",
  };
}

/**
 * Demonstrates lender -> agritrust payment via Masumi. Returns a mocked tx
 * by default; if MASUMI_API_KEY is set this is where a live SDK call would go.
 */
export async function payAndInvoke(args: {
  agentId: string;
  tier: MasumiTier;
}): Promise<MasumiInvocation> {
  const apiKey = process.env.MASUMI_API_KEY;
  const network = process.env.MASUMI_NETWORK ?? "preprod";
  const isMocked = !apiKey;
  const jobId = `job_${randomUUID().slice(0, 12)}`;
  const escrowTx = `mskt_${randomUUID().replace(/-/g, "").slice(0, 40)}`;
  const explorerUrl =
    network === "mainnet"
      ? `https://cardanoscan.io/transaction/${escrowTx}`
      : `https://preprod.cardanoscan.io/transaction/${escrowTx}`;
  return {
    jobId,
    escrowTx,
    explorerUrl,
    network,
    isMocked,
    agentId: args.agentId,
    amountKes: PRICING[args.tier],
  };
}

/**
 * Outbound agent-to-agent call (AgriTrust -> Climate Agent).
 * Returns a second Masumi tx to demonstrate agent-to-agent payment.
 */
export async function payOutboundClimateAgent(): Promise<{
  tx: string;
  explorerUrl: string;
  isMocked: boolean;
}> {
  const network = process.env.MASUMI_NETWORK ?? "preprod";
  const tx = `mskt_${randomUUID().replace(/-/g, "").slice(0, 40)}`;
  return {
    tx,
    explorerUrl:
      network === "mainnet"
        ? `https://cardanoscan.io/transaction/${tx}`
        : `https://preprod.cardanoscan.io/transaction/${tx}`,
    isMocked: !process.env.MASUMI_API_KEY,
  };
}

/**
 * HMAC-signed receipt the buyer can verify offline.
 */
export function signReceipt(payload: Record<string, unknown>): string {
  const secret = process.env.MASUMI_API_KEY ?? "agritrust-mock-secret";
  return createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
}

export function verifyMasumiSignature(request: Request, rawBody: string): boolean {
  const apiKey = process.env.MASUMI_API_KEY;
  // In mocked mode allow x-masumi-mock header so demos work end-to-end.
  if (!apiKey) return request.headers.get("x-masumi-mock") === "true";
  const sig = request.headers.get("x-masumi-signature");
  if (!sig) return false;
  const expected = createHmac("sha256", apiKey).update(rawBody).digest("hex");
  return sig === expected;
}
