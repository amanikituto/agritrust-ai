import { createFileRoute } from "@tanstack/react-router";

// USSD short code: *483*900#
// Africa's Talking POSTs application/x-www-form-urlencoded:
//   sessionId, serviceCode, phoneNumber, text
// Response: plain text — prefix "CON " to continue, "END " to terminate.

function res(text: string) {
  return new Response(text, { status: 200, headers: { "content-type": "text/plain" } });
}

async function loadAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function findUser(phone: string) {
  const supabase = await loadAdmin();
  const { data: existing } = await supabase.from("profiles").select("id").eq("phone", phone).maybeSingle();
  return existing?.id ?? null;
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

        await supabase.from("ussd_sessions").upsert({
          session_id: sessionId, phone, step: steps[0] ?? "menu", payload: { text },
        });

        if (steps.length === 0) {
          return res(
            `CON Karibu AgriTrust AI\n` +
            `1. Apply for Loan\n` +
            `2. Check Trust Score\n` +
            `3. Loan Status\n` +
            `4. Update Farm Records\n` +
            `5. Climate Alerts\n` +
            `6. Exit`,
          );
        }

        const userId = await findUser(phone);

        // 1: Apply for loan
        if (steps[0] === "1") {
          if (!userId) return res("END No account found for this number. Register on AgriTrust AI online first.");
          if (steps.length === 1) return res("CON Enter amount in KES:");
          if (steps.length === 2) return res("CON Term in months (3-24):");
          if (steps.length === 3) return res("CON Purpose:\n1. Seeds\n2. Equipment\n3. Livestock\n4. Other");
          if (steps.length === 4) {
            const amount = Number(steps[1]);
            const term = Number(steps[2]);
            const purposeMap: Record<string, string> = { "1": "seeds", "2": "equipment", "3": "livestock", "4": "other" };
            const purpose = purposeMap[steps[3]] ?? "other";
            if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(term)) return res("END Invalid input.");
            const { data: ts } = await supabase.from("trust_scores").select("score, climate_risk").eq("farmer_id", userId).order("computed_at", { ascending: false }).limit(1).maybeSingle();
            const score = ts?.score ?? null;
            const rec = score == null ? "review" : score >= 70 ? "approve" : score >= 55 ? "review" : "decline";
            const { error } = await supabase.from("loan_applications").insert({
              farmer_id: userId, amount_kes: amount, term_months: term, purpose,
              status: "submitted", source: "ussd",
              trust_score_snapshot: score, climate_risk_snapshot: ts?.climate_risk ?? null,
              ai_recommendation: rec,
            });
            if (error) return res(`END Failed: ${error.message}`);
            await supabase.from("notifications").insert({
              user_id: userId, type: "loan_approval",
              title: "USSD loan submitted", body: `KES ${amount.toLocaleString()} · ${term}m · AI: ${rec}`,
            });
            return res("END Application submitted via USSD. You will receive an SMS when reviewed.");
          }
        }

        // 2: Trust Score
        if (steps[0] === "2") {
          if (!userId) return res("END No account found for this number.");
          const { data: ts } = await supabase.from("trust_scores").select("score, credit_readiness, climate_risk").eq("farmer_id", userId).order("computed_at", { ascending: false }).limit(1).maybeSingle();
          if (!ts) return res("END No trust score yet. Complete your intake form online.");
          return res(`END Trust Score: ${ts.score}/100\nReadiness: ${ts.credit_readiness}%\nClimate risk: ${ts.climate_risk}`);
        }

        // 3: Loan Status
        if (steps[0] === "3") {
          if (!userId) return res("END No account found.");
          const { data: loans } = await supabase.from("loan_applications").select("amount_kes, status").eq("farmer_id", userId).order("created_at", { ascending: false }).limit(3);
          if (!loans?.length) return res("END No loan applications yet.");
          return res("END Recent loans:\n" + loans.map((l, i) => `${i + 1}. KES ${l.amount_kes} - ${l.status}`).join("\n"));
        }

        // 4: Update farm records
        if (steps[0] === "4") {
          if (!userId) return res("END No account found.");
          if (steps.length === 1) return res("CON Record type:\n1. Harvest\n2. Sale\n3. Repayment\n4. Training\n5. Weather damage");
          if (steps.length === 2) return res("CON Amount in KES (or 0):");
          if (steps.length === 3) {
            const map: Record<string, string> = { "1": "harvest", "2": "sale", "3": "repayment", "4": "training", "5": "weather_damage" };
            const type = map[steps[1]];
            const amt = Number(steps[2]);
            if (!type) return res("END Invalid type.");
            const { error } = await supabase.from("farm_records").insert({
              farmer_id: userId, record_type: type, amount_kes: Number.isFinite(amt) && amt > 0 ? amt : null,
            });
            if (error) return res(`END Failed: ${error.message}`);
            return res("END Update saved. Your Trust Score will refresh shortly.");
          }
        }

        // 5: Climate alerts
        if (steps[0] === "5") {
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

        if (steps[0] === "6") return res("END Asante. Kwaheri!");

        return res("END Invalid choice.");
      },
    },
  },
});
