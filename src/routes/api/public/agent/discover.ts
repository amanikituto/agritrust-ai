import { createFileRoute } from "@tanstack/react-router";
import { getAgritrustAgentInfo } from "@/lib/masumi.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/agent/discover")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const agent = getAgritrustAgentInfo(origin);
        return Response.json(
          {
            ok: true,
            agent,
            tiers: [
              { id: "basic", description: "Trust score + recommendation only", priceKes: agent.pricingKes.basic },
              { id: "standard", description: "Adds identity + farm summary", priceKes: agent.pricingKes.standard },
              { id: "premium", description: "Adds Neo4j relationship signals", priceKes: agent.pricingKes.premium },
            ],
          },
          { headers: { ...CORS, "Cache-Control": "public, max-age=60" } },
        );
      },
    },
  },
});
