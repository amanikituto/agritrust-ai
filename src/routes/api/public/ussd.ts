import { createFileRoute } from "@tanstack/react-router";

// Africa's Talking USSD POSTs application/x-www-form-urlencoded:
// sessionId, serviceCode, phoneNumber, text
// Response: plain text. Prefix "CON " to continue, "END " to terminate.

function res(text: string) {
  return new Response(text, { status: 200, headers: { "content-type": "text/plain" } });
}

async function loadAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function findOrShadowUser(phone: string) {
  const supabase = await loadAdmin();
  const { data: existing } = await supabase.from("profiles").select("id").eq("phone", phone).maybeSingle();
  if (existing?.id) return existing.id;
  return null;
}

export const Route = createFileRoute("/api/public/ussd")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const params = new URLSearchParams(body);
        const sessionId = params.get("sessionId") ?? "";
        const phone = params.get("phoneNumber") ?? "";
        const text = (params.get("text") ?? "").trim();
        const steps = text === "" ? [] : text.split("*");
        const supabase = await loadAdmin();

        // Persist/refresh session
        await supabase.from("ussd_sessions").upsert({
          session_id: sessionId,
          phone,
          step: steps[0] ?? "menu",
          payload: { text },
        });

        // Root menu
        if (steps.length === 0) {
          return res(
            `CON Karibu AgriTrust AI\n` +
            `1. Trust Score\n` +
            `2. Apply for Loan\n` +
            `3. Loan Status\n` +
            `4. Weather & Advisory\n` +
            `5. Data Marketplace (opt in/out)`,
          );
        }

        const userId = await findOrShadowUser(phone);

        // 1: Trust Score
        if (steps[0] === "1") {
          if (!userId) return res("END No account found for this number. Register on agritrust-ai.lovable.app");
          const { data: ts } = await supabase.from("trust_scores").select("score, credit_readiness, climate_risk").eq("farmer_id", userId).order("computed_at", { ascending: false }).limit(1).maybeSingle();
          if (!ts) return res("END No trust score yet. Complete your profile online to compute one.");
          return res(`END Trust Score: ${ts.score}/100\nReadiness: ${ts.credit_readiness}%\nClimate risk: ${ts.climate_risk}`);
        }

        // 2: Apply for loan — 2*<amount>*<months>*<purpose-choice>
        if (steps[0] === "2") {
          if (!userId) return res("END No account. Register online first.");
          if (steps.length === 1) return res("CON Enter amount in KES:");
          if (steps.length === 2) return res("CON Term in months (3-24):");
          if (steps.length === 3) return res("CON Purpose:\n1. Seeds\n2. Equipment\n3. Livestock\n4. Other");
          if (steps.length === 4) {
            const amount = Number(steps[1]);
            const term = Number(steps[2]);
            const purposeMap: Record<string, string> = { "1": "seeds", "2": "equipment", "3": "livestock", "4": "other" };
            const purpose = purposeMap[steps[3]] ?? "other";
            if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(term)) return res("END Invalid input.");
            const { error } = await supabase.from("loan_applications").insert({
              farmer_id: userId, amount_kes: amount, term_months: term, purpose, status: "submitted",
            });
            if (error) return res(`END Failed: ${error.message}`);
            return res("END Application submitted. You will receive an SMS when reviewed.");
          }
        }

        // 3: Loan Status
        if (steps[0] === "3") {
          if (!userId) return res("END No account found.");
          const { data: loans } = await supabase.from("loan_applications").select("id, amount_kes, status, created_at").eq("farmer_id", userId).order("created_at", { ascending: false }).limit(3);
          if (!loans?.length) return res("END No loan applications yet.");
          return res("END Recent loans:\n" + loans.map((l, i) => `${i + 1}. KES ${l.amount_kes} — ${l.status}`).join("\n"));
        }

        // 4: Weather
        if (steps[0] === "4") {
          if (steps.length === 1) return res("CON Enter county name (e.g. Kiambu):");
          const county = steps[1];
          try {
            const { getClimate } = await import("@/lib/climate.functions");
            const c = await getClimate({ data: { county } });
            return res(`END ${c.location.name}\nTemp: ${c.current.temperatureC.toFixed(1)}C\nRain 7d: ${c.rainfall7d}mm\nDrought: ${c.droughtIndex}`);
          } catch {
            return res("END Weather temporarily unavailable.");
          }
        }

        // 5: Marketplace opt
        if (steps[0] === "5") {
          if (!userId) return res("END No account found.");
          if (steps.length === 1) return res("CON 1. Opt IN to data marketplace\n2. Opt OUT");
          if (steps.length === 2) {
            const active = steps[1] === "1";
            await supabase.from("data_products").update({ is_active: active }).eq("farmer_id", userId);
            return res(`END You are now ${active ? "opted IN" : "opted OUT"} of the data marketplace.`);
          }
        }

        return res("END Invalid choice.");
      },
    },
  },
});
