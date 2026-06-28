import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PRODUCT_CATALOGUE = [
  { type: "farm_records", title: "Farm Records", price: 250 },
  { type: "yield_history", title: "Yield History", price: 400 },
  { type: "mobile_money_summary", title: "Mobile-Money Summary", price: 600 },
  { type: "trust_score_snapshot", title: "Trust Score Snapshot", price: 350 },
  { type: "climate_exposure", title: "Climate Exposure", price: 300 },
  { type: "geolocation", title: "Geolocation", price: 200 },
] as const;

export const listMyProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("data_products")
      .select("*")
      .eq("farmer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; product_type: string; title: string; description?: string; price_kes: number; is_active?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const row = { ...data, farmer_id: context.userId };
    const { data: out, error } = await context.supabase.from("data_products").upsert(row).select().single();
    if (error) throw error;
    return out;
  });

export const browseMarketplace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("data_products")
      .select("id, product_type, title, description, price_kes, farmer_id, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });

export const purchaseProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { product_id: string; access_days?: number }) => d)
  .handler(async ({ data, context }) => {
    const { data: product, error: pErr } = await context.supabase
      .from("data_products")
      .select("*")
      .eq("id", data.product_id)
      .maybeSingle();
    if (pErr || !product) throw new Error("Product not found");

    const days = data.access_days ?? 30;
    const token = crypto.randomUUID().replace(/-/g, "");
    const expires_at = new Date(Date.now() + days * 86400_000).toISOString();

    // Mock payload — in production this would be the materialized dataset.
    const payload = {
      product_type: product.product_type,
      issued_at: new Date().toISOString(),
      sample: product.sample ?? { note: "Live dataset stub — wire to source in production" },
    };

    const { data: purchase, error } = await context.supabase
      .from("data_purchases")
      .insert({
        product_id: product.id,
        lender_id: context.userId,
        farmer_id: product.farmer_id,
        amount_kes: product.price_kes,
        status: "active",
        access_token: token,
        expires_at,
        payload,
      })
      .select()
      .single();
    if (error) throw error;

    const { supabaseAdmin: _adminA } = await import("@/integrations/supabase/client.server");
    await _adminA.from("audit_events").insert({
      actor_id: context.userId,
      action: "data.purchase",
      entity_type: "data_purchase",
      entity_id: purchase.id,
      metadata: { product_type: product.product_type, amount_kes: product.price_kes },
    });


    // Fire-and-forget Neo4j edge
    try {
      const { runQuery } = await import("./neo4j.server");
      await runQuery(
        `MERGE (f:Farmer {id:$farmer}) MERGE (l:Lender {id:$lender})
         MERGE (f)-[r:SOLD_DATA {purchase:$pid}]->(l) SET r.ts=timestamp(), r.product=$ptype`,
        { farmer: product.farmer_id, lender: context.userId, pid: purchase.id, ptype: product.product_type },
      );
    } catch {/* graceful */}

    return purchase;
  });

export const myPurchases = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("data_purchases")
      .select("*, data_products(title, product_type)")
      .eq("lender_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const mySales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("data_purchases")
      .select("*, data_products(title, product_type)")
      .eq("farmer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const myWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("wallets").select("*").eq("user_id", context.userId).maybeSingle();
    return data ?? { user_id: context.userId, balance_kes: 0 };
  });

export const revokeConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { purchase_id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("data_purchases")
      .update({ status: "revoked" })
      .eq("id", data.purchase_id)
      .eq("farmer_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
