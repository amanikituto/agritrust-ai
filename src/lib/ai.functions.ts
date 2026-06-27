import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-2.5-flash";

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messages: { role: "user" | "assistant" | "system"; content: string }[]; role: "farmer" | "lender" }) => d)
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    let grounding = "";
    if (data.role === "farmer") {
      const { data: fp } = await context.supabase.from("farmer_profiles").select("*").eq("id", context.userId).maybeSingle();
      const { data: ts } = await context.supabase.from("trust_scores").select("*").eq("farmer_id", context.userId).order("computed_at", { ascending: false }).limit(1).maybeSingle();
      grounding = `Farmer profile: ${JSON.stringify(fp ?? {})}. Latest trust score: ${JSON.stringify(ts ?? {})}.`;
    } else {
      const { data: apps } = await context.supabase.from("loan_applications").select("id,status,amount_kes,created_at").limit(20);
      grounding = `Recent loan applications in your portfolio: ${JSON.stringify(apps ?? [])}.`;
    }

    const system = {
      role: "system" as const,
      content: `You are AgriTrust AI assistant for a ${data.role} on an agricultural credit platform serving Kenyan farmers. Be concise, friendly, bilingual EN/SW when asked. Use this context: ${grounding}`,
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL, messages: [system, ...data.messages] }),
    });
    if (!res.ok) {
      const txt = await res.text();
      if (res.status === 429) throw new Error("Rate limited — please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Top up workspace credits.");
      throw new Error(`AI error: ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    return { reply: json.choices?.[0]?.message?.content ?? "(no reply)" };
  });
