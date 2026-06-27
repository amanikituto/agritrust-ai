import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  payOutboundClimateAgent,
  signReceipt,
  verifyMasumiSignature,
  type MasumiTier,
} from "@/lib/masumi.server";
import { buildAgritrustProfile } from "@/lib/agritrust-agent.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Masumi-Signature, X-Masumi-Mock",
};

const Body = z.object({
  farmerId: z.string().min(1),
  tier: z.enum(["basic", "standard", "premium"]),
  jobId: z.string().min(1),
});

function err(status: number, code: string, message: string) {
  return Response.json({ ok: false, error: { code, message } }, { status, headers: CORS });
}

export const Route = createFileRoute("/api/public/agent/invoke")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const rawBody = await request.text();
        if (!verifyMasumiSignature(request, rawBody)) {
          return err(401, "invalid_signature", "Masumi signature required (or x-masumi-mock: true in dev)");
        }
        let json: unknown;
        try {
          json = JSON.parse(rawBody);
        } catch {
          return err(400, "bad_json", "Body must be JSON");
        }
        const parsed = Body.safeParse(json);
        if (!parsed.success) {
          return err(400, "bad_input", parsed.error.issues.map((i) => i.message).join(", "));
        }
        const { farmerId, tier, jobId } = parsed.data;

        // Service-role client — this endpoint is the AgriTrust agent itself.
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) return err(500, "missing_env", "Server is not configured");
        const supabase = createClient<Database>(url, key);

        try {
          const profile = await buildAgritrustProfile({ farmerId, tier: tier as MasumiTier }, supabase as never);
          const climate = await payOutboundClimateAgent();
          const receipt = {
            jobId,
            farmerId,
            tier,
            score: profile.masumi_trust_score,
            issuedAt: new Date().toISOString(),
          };
          const signature = signReceipt(receipt);
          return Response.json(
            { ok: true, jobId, profile, climate, receipt, signature },
            { headers: CORS },
          );
        } catch (e) {
          const message = e instanceof Error ? e.message : "Unknown error";
          return err(500, "agent_failure", message);
        }
      },
    },
  },
});
