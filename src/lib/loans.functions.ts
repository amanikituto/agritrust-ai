import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const applyForLoan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { amount_kes: number; term_months: number; purpose: string }) => d)
  .handler(async ({ data, context }) => {
    // Pull latest trust score to snapshot at application time
    const { data: ts } = await context.supabase
      .from("trust_scores")
      .select("score, climate_risk, top_positive_factors, top_negative_factors")
      .eq("farmer_id", context.userId)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const score = ts?.score ?? null;
    const rec = score == null ? "review" : score >= 700 ? "approve" : score >= 550 ? "review" : "decline";
    const conf = score == null ? 0.5 : Math.min(0.99, 0.5 + Math.abs(score - 600) / 400);

    const { data: row, error } = await context.supabase
      .from("loan_applications")
      .insert({
        farmer_id: context.userId,
        amount_kes: data.amount_kes,
        term_months: data.term_months,
        purpose: data.purpose,
        status: "submitted",
        trust_score_snapshot: score,
        climate_risk_snapshot: ts?.climate_risk ?? null,
        ai_recommendation: rec,
        ai_confidence: conf,
        top_positive_factors: ts?.top_positive_factors ?? null,
        top_negative_factors: ts?.top_negative_factors ?? null,
      })
      .select()
      .single();
    if (error) throw error;

    await context.supabase.from("notifications").insert({
      user_id: context.userId,
      type: "loan_update",
      title: "Loan application submitted",
      body: `KES ${data.amount_kes.toLocaleString()} · ${data.term_months} months · AI: ${rec}`,
    });

    return row;
  });

export const listMyLoans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("loan_applications")
      .select("*")
      .eq("farmer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listAllApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("loan_applications")
      .select("id, farmer_id, amount_kes, term_months, purpose, status, trust_score_snapshot, climate_risk_snapshot, ai_recommendation, ai_confidence, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const farmerIds = Array.from(new Set((data ?? []).map((r) => r.farmer_id)));
    if (farmerIds.length === 0) return [];
    const [{ data: profiles }, { data: fps }] = await Promise.all([
      context.supabase.from("profiles").select("id, full_name").in("id", farmerIds),
      context.supabase.from("farmer_profiles").select("id, county, cooperative, gender, has_disability").in("id", farmerIds),
    ]);
    const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const fMap = new Map((fps ?? []).map((f) => [f.id, f]));
    return (data ?? []).map((r) => ({
      ...r,
      farmer_name: pMap.get(r.farmer_id)?.full_name ?? "Farmer",
      county: fMap.get(r.farmer_id)?.county ?? "—",
      cooperative: fMap.get(r.farmer_id)?.cooperative ?? "—",
      gender: fMap.get(r.farmer_id)?.gender ?? null,
      has_disability: fMap.get(r.farmer_id)?.has_disability ?? false,
    }));
  });

export const getApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: app, error } = await context.supabase
      .from("loan_applications")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!app) return null;
    const [{ data: profile }, { data: fp }] = await Promise.all([
      context.supabase.from("profiles").select("full_name, email, phone").eq("id", app.farmer_id).maybeSingle(),
      context.supabase.from("farmer_profiles").select("*").eq("id", app.farmer_id).maybeSingle(),
    ]);
    return { ...app, profile, farmer: fp };
  });

export const decideApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; decision: "approved" | "rejected" | "under_review"; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("loan_applications")
      .update({
        status: data.decision,
        reviewer_notes: data.notes ?? null,
        lender_id: context.userId,
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;

    await context.supabase.from("notifications").insert({
      user_id: row.farmer_id,
      type: "loan_update",
      title: `Loan ${data.decision}`,
      body: data.notes ?? `Your application was ${data.decision}.`,
    });

    await context.supabase.from("audit_events").insert({
      actor_id: context.userId,
      action: "loan.decision",
      entity_type: "loan_application",
      entity_id: row.id,
      metadata: { decision: data.decision },
    });

    return row;
  });
