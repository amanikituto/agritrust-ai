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
      type: "loan_approval",
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
      .select("id, farmer_id, amount_kes, term_months, purpose, status, trust_score_snapshot, climate_risk_snapshot, ai_recommendation, ai_confidence, top_positive_factors, top_negative_factors, created_at")
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

export const getLenderPortfolioMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: applications, error: appError }, { data: farmers }] = await Promise.all([
      context.supabase
        .from("loan_applications")
        .select("id, farmer_id, amount_kes, status, trust_score_snapshot, climate_risk_snapshot, ai_recommendation, ai_confidence, created_at")
        .order("created_at", { ascending: true }),
      context.supabase
        .from("farmer_profiles")
        .select("id, county, cooperative, gender, has_disability, crops, farm_size_acres, is_youth"),
    ]);
    if (appError) throw appError;

    const apps = applications ?? [];
    const farmerRows = farmers ?? [];
    const farmerMap = new Map(farmerRows.map((f) => [f.id, f]));
    const submitted = apps.length;
    const approvedStatuses = new Set(["approved", "disbursed", "repaid"]);
    const approved = apps.filter((a) => approvedStatuses.has(a.status)).length;
    const rejected = apps.filter((a) => a.status === "rejected").length;
    const review = apps.filter((a) => a.status === "submitted" || a.status === "under_review").length;
    const portfolioValue = apps
      .filter((a) => approvedStatuses.has(a.status))
      .reduce((sum, a) => sum + Number(a.amount_kes ?? 0), 0);
    const requestedValue = apps.reduce((sum, a) => sum + Number(a.amount_kes ?? 0), 0);
    const scores = apps.map((a) => a.trust_score_snapshot).filter((v): v is number => typeof v === "number");
    const avgTrust = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const sortedScores = [...scores].sort((a, b) => a - b);
    const medianTrust = sortedScores.length ? sortedScores[Math.floor(sortedScores.length / 2)] : 0;
    const topDecile = sortedScores.length ? sortedScores[Math.max(0, Math.floor(sortedScores.length * 0.9) - 1)] : 0;
    const atRisk = scores.filter((s) => s < 600).length;
    const highClimate = apps.filter((a) => (a.climate_risk_snapshot ?? "").toLowerCase() === "high").length;
    const defaultProxy = submitted ? Math.round(((rejected + apps.filter((a) => (a.ai_recommendation ?? "") === "decline").length * 0.5) / submitted) * 1000) / 10 : 0;
    const approvalRate = submitted ? Math.round((approved / submitted) * 1000) / 10 : 0;
    const womenFarmers = farmerRows.filter((f) => f.gender === "female").length;
    const disabilityFarmers = farmerRows.filter((f) => f.has_disability).length;
    const youthFarmers = farmerRows.filter((f) => f.is_youth).length;

    const monthLabels: string[] = [];
    const monthlyCounts: number[] = [];
    const monthlyValue: number[] = [];
    const monthlyApprovals: number[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthLabels.push(d.toLocaleString("en", { month: "short" }).slice(0, 3));
      const monthApps = apps.filter((a) => (a.created_at ?? "").slice(0, 7) === key);
      monthlyCounts.push(monthApps.length);
      monthlyApprovals.push(monthApps.filter((a) => approvedStatuses.has(a.status)).length);
      monthlyValue.push(Math.round(monthApps.reduce((sum, a) => sum + Number(a.amount_kes ?? 0), 0) / 1_000_000));
    }

    const scoreBuckets = [0, 0, 0, 0, 0, 0];
    for (const score of scores) {
      const idx = Math.min(5, Math.max(0, Math.floor((score - 500) / 50)));
      scoreBuckets[idx] += 1;
    }

    const cropCounts = new Map<string, number>();
    for (const f of farmerRows) {
      for (const crop of f.crops ?? []) cropCounts.set(crop, (cropCounts.get(crop) ?? 0) + 1);
    }
    const cropEntries = [...cropCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const cropTotal = cropEntries.reduce((sum, [, value]) => sum + value, 0);
    const cropMix = cropEntries.map(([label, value], i) => ({
      label,
      value: cropTotal ? Math.max(1, Math.round((value / cropTotal) * 100)) : 0,
      color: ["var(--emerald)", "var(--sky)", "var(--gold)", "var(--violet)", "var(--rose)"][i],
    }));

    const countyStats = new Map<string, { applications: number; totalScore: number; scoreCount: number; highClimate: number; amount: number }>();
    for (const a of apps) {
      const f = farmerMap.get(a.farmer_id);
      const county = f?.county ?? "Unknown";
      const row = countyStats.get(county) ?? { applications: 0, totalScore: 0, scoreCount: 0, highClimate: 0, amount: 0 };
      row.applications += 1;
      row.amount += Number(a.amount_kes ?? 0);
      if (typeof a.trust_score_snapshot === "number") {
        row.totalScore += a.trust_score_snapshot;
        row.scoreCount += 1;
      }
      if ((a.climate_risk_snapshot ?? "").toLowerCase() === "high") row.highClimate += 1;
      countyStats.set(county, row);
    }
    const counties = [...countyStats.entries()].map(([name, s]) => ({
      name,
      applications: s.applications,
      avgScore: s.scoreCount ? Math.round(s.totalScore / s.scoreCount) : 0,
      climateRisk: s.applications ? Math.round((s.highClimate / s.applications) * 100) : 0,
      amount: s.amount,
    })).sort((a, b) => b.applications - a.applications).slice(0, 14);

    const riskDistribution = [0, 0, 0, 0, 0, 0];
    for (const a of apps) {
      const score = a.trust_score_snapshot ?? 600;
      const climateAdd = (a.climate_risk_snapshot ?? "").toLowerCase() === "high" ? 0.12 : (a.climate_risk_snapshot ?? "").toLowerCase() === "medium" ? 0.06 : 0.02;
      const pd = Math.max(0.01, Math.min(0.4, (700 - score) / 700 + climateAdd));
      const bucket = Math.min(5, Math.max(0, Math.floor(pd / 0.07)));
      riskDistribution[bucket] += 1;
    }

    const watchlist = [
      { title: "High-value applications > KES 250k", count: apps.filter((a) => Number(a.amount_kes) > 250_000 && !approvedStatuses.has(a.status)).length, tone: "gold" as const, href: "/lender/applications" },
      { title: "High climate-risk applications", count: highClimate, tone: "rose" as const, href: "/lender/climate" },
      { title: "At-risk trust scores < 600", count: atRisk, tone: "gold" as const, href: "/lender/trust" },
      { title: "Manual review queue", count: review, tone: "sky" as const, href: "/lender/applications" },
    ];

    return {
      submitted,
      approved,
      rejected,
      review,
      portfolioValue,
      requestedValue,
      approvalRate,
      defaultProxy,
      avgTrust,
      medianTrust,
      topDecile,
      atRisk,
      highClimate,
      farmerCount: farmerRows.length,
      womenPct: farmerRows.length ? Math.round((womenFarmers / farmerRows.length) * 100) : 0,
      disabilityPct: farmerRows.length ? Math.round((disabilityFarmers / farmerRows.length) * 100) : 0,
      youthPct: farmerRows.length ? Math.round((youthFarmers / farmerRows.length) * 100) : 0,
      monthLabels,
      monthlyCounts,
      monthlyValue,
      monthlyApprovals,
      scoreBuckets,
      cropMix: cropMix.length ? cropMix : [{ label: "No crop data", value: 1, color: "var(--emerald)" }],
      counties,
      riskDistribution,
      watchlist,
    };
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
      type: data.decision === "approved" ? "loan_approval" : data.decision === "rejected" ? "loan_rejection" : "system",
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
