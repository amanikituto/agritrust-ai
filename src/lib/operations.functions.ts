import { createServerFn } from "@tanstack/react-start";

export const recomputeFarmerScore = createServerFn({ method: "POST" })
  .inputValidator((d: { farmerId: string }) => d)
  .handler(async ({ data }) => {
    const { computeTrustScoreFor } = await import("./trust-score.server");
    return await computeTrustScoreFor(data.farmerId);
  });

export const addFarmRecordPublic = createServerFn({ method: "POST" })
  .inputValidator((d: {
    farmerId: string;
    record_type: string;
    amount_kes?: number;
    quantity?: number;
    unit?: string;
    counterparty?: string;
    notes?: string;
    occurred_on?: string;
  }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("farm_records").insert({
      farmer_id: data.farmerId,
      record_type: data.record_type,
      amount_kes: data.amount_kes ?? null,
      quantity: data.quantity ?? null,
      unit: data.unit ?? null,
      counterparty: data.counterparty ?? null,
      notes: data.notes ?? null,
      occurred_on: data.occurred_on ?? new Date().toISOString().slice(0, 10),
    }).select().single();
    if (error) throw error;

    let scoreBefore: number | null = null;
    const { data: prev } = await supabaseAdmin
      .from("trust_scores").select("score")
      .eq("farmer_id", data.farmerId)
      .order("computed_at", { ascending: false }).limit(1).maybeSingle();
    scoreBefore = prev?.score ?? null;

    const { computeTrustScoreFor } = await import("./trust-score.server");
    const updated = await computeTrustScoreFor(data.farmerId);

    try {
      const { seedFarmerGraphById } = await import("./graph-admin.server");
      await seedFarmerGraphById(data.farmerId);
    } catch { /* graph optional */ }

    return { record: row, scoreBefore, scoreAfter: updated.score, delta: scoreBefore == null ? 0 : updated.score - scoreBefore };
  });

export const submitLoanPublic = createServerFn({ method: "POST" })
  .inputValidator((d: { farmerId: string; amount_kes: number; term_months: number; purpose: string; source?: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ts } = await supabaseAdmin
      .from("trust_scores").select("score, climate_risk")
      .eq("farmer_id", data.farmerId)
      .order("computed_at", { ascending: false }).limit(1).maybeSingle();
    const score = ts?.score ?? null;
    const rec = score == null ? "review" : score >= 80 ? "approve" : score >= 60 ? "approve_with_conditions" : score >= 40 ? "review" : "decline";

    const { data: row, error } = await supabaseAdmin.from("loan_applications").insert({
      farmer_id: data.farmerId,
      amount_kes: data.amount_kes,
      term_months: data.term_months,
      purpose: data.purpose,
      source: data.source ?? "web",
      status: "submitted",
      trust_score_snapshot: score,
      climate_risk_snapshot: ts?.climate_risk ?? null,
      ai_recommendation: rec,
    }).select().single();
    if (error) throw error;
    return row;
  });

export const decideLoanPublic = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; decision: "approved" | "approved_with_conditions" | "needs_info" | "rejected"; notes?: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("loan_applications").update({
      status: data.decision, reviewer_notes: data.notes ?? null,
    }).eq("id", data.id).select().single();
    if (error) throw error;
    await supabaseAdmin.from("audit_events").insert({
      action: "loan.decision", entity_type: "loan_application", entity_id: row.id,
      metadata: { decision: data.decision, notes: data.notes ?? null },
    });
    return row;
  });

export const getLoanWithFarmer = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin.from("loan_applications").select("*").eq("id", data.id).maybeSingle();
    if (!app) return null;
    const [{ data: profile }, { data: fp }, { data: ts }] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name, phone").eq("id", app.farmer_id).maybeSingle(),
      supabaseAdmin.from("farmer_profiles").select("*").eq("id", app.farmer_id).maybeSingle(),
      supabaseAdmin.from("trust_scores").select("*").eq("farmer_id", app.farmer_id).order("computed_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    return { app, profile, farmer: fp, trust: ts };
  });

export const listAllLoans = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: apps } = await supabaseAdmin
      .from("loan_applications")
      .select("*").order("created_at", { ascending: false }).limit(100);
    const ids = (apps ?? []).map((a) => a.farmer_id);
    const [{ data: profiles }, { data: fps }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name").in("id", ids),
      supabaseAdmin.from("farmer_profiles").select("id, county").in("id", ids),
    ]);
    const pm = new Map((profiles ?? []).map((p) => [p.id, p]));
    const fm = new Map((fps ?? []).map((f) => [f.id, f]));
    return (apps ?? []).map((a) => ({
      ...a,
      farmer_name: pm.get(a.farmer_id)?.full_name ?? "Farmer",
      county: fm.get(a.farmer_id)?.county ?? "—",
    }));
  });
