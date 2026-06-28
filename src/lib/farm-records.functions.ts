import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const RECORD_TYPES = [
  "planting",
  "harvest",
  "input_purchase",
  "sale",
  "repayment",
  "training",
  "extension_visit",
  "coop_meeting",
  "weather_damage",
  "pest_outbreak",
  "insurance",
  "savings_deposit",
  "equipment",
] as const;

export type RecordType = (typeof RECORD_TYPES)[number];

export const listMyFarmRecords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("farm_records")
      .select("*")
      .eq("farmer_id", context.userId)
      .order("occurred_on", { ascending: false })
      .limit(200);
    return data ?? [];
  });

export const addFarmRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    record_type: RecordType;
    amount_kes?: number;
    quantity?: number;
    unit?: string;
    counterparty?: string;
    notes?: string;
    occurred_on?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("farm_records")
      .insert({
        farmer_id: context.userId,
        record_type: data.record_type,
        amount_kes: data.amount_kes ?? null,
        quantity: data.quantity ?? null,
        unit: data.unit ?? null,
        counterparty: data.counterparty ?? null,
        notes: data.notes ?? null,
        occurred_on: data.occurred_on ?? new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error) throw error;

    // Re-seed graph relationship for this record (best-effort, never blocks).
    try {
      const { seedFarmerGraph } = await import("./graph.functions");
      await seedFarmerGraph({ data: { farmerId: context.userId } });
    } catch { /* graph unavailable — fine */ }

    return row;
  });
