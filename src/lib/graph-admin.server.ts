// Server-only helpers (cannot be imported from the browser).
import { runQuery } from "@/lib/neo4j.server";

export async function seedFarmerGraphById(farmerId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: fp }, { data: profile }, { data: loans }, { data: records }] = await Promise.all([
    supabaseAdmin.from("farmer_profiles").select("*").eq("id", farmerId).maybeSingle(),
    supabaseAdmin.from("profiles").select("full_name, phone").eq("id", farmerId).maybeSingle(),
    supabaseAdmin.from("loan_applications").select("id, amount_kes, status, lender_id").eq("farmer_id", farmerId),
    supabaseAdmin.from("farm_records").select("record_type, counterparty, amount_kes").eq("farmer_id", farmerId).limit(100),
  ]);
  const name = profile?.full_name ?? "Farmer";

  await runQuery(
    `MERGE (f:Farmer {id:$id})
     SET f.name=$name, f.county=$county, f.gender=$gender, f.cooperative=$coop`,
    { id: farmerId, name, county: fp?.county ?? null, gender: fp?.gender ?? null, coop: fp?.cooperative ?? null },
  );

  if (fp?.cooperative) {
    await runQuery(
      `MERGE (c:Cooperative {name:$coop})
       WITH c MATCH (f:Farmer {id:$id})
       MERGE (f)-[:MEMBER_OF]->(c)`,
      { id: farmerId, coop: fp.cooperative },
    );
  }
  for (const crop of fp?.crops ?? []) {
    await runQuery(
      `MERGE (cr:Crop {name:$crop})
       WITH cr MATCH (f:Farmer {id:$id})
       MERGE (f)-[:GROWS]->(cr)`,
      { id: farmerId, crop },
    );
  }
  for (const sup of fp?.input_suppliers ?? []) {
    await runQuery(
      `MERGE (s:InputSupplier {name:$sup})
       WITH s MATCH (f:Farmer {id:$id})
       MERGE (f)-[:PURCHASED_FROM]->(s)`,
      { id: farmerId, sup },
    );
  }
  for (const b of fp?.main_buyers ?? []) {
    await runQuery(
      `MERGE (b:Buyer {name:$b})
       WITH b MATCH (f:Farmer {id:$id})
       MERGE (f)-[:SOLD_TO]->(b)`,
      { id: farmerId, b },
    );
  }
  for (const r of fp?.climate_risks ?? []) {
    await runQuery(
      `MERGE (e:ClimateEvent {name:$r})
       WITH e MATCH (f:Farmer {id:$id})
       MERGE (f)-[:EXPERIENCED]->(e)`,
      { id: farmerId, r },
    );
  }
  for (const l of loans ?? []) {
    await runQuery(
      `MERGE (ln:Loan {id:$lid})
       SET ln.amount=$amt, ln.status=$status
       WITH ln MATCH (f:Farmer {id:$id})
       MERGE (f)-[:APPLIED_FOR]->(ln)`,
      { id: farmerId, lid: l.id, amt: Number(l.amount_kes), status: l.status },
    );
  }
  const relMap: Record<string, string> = {
    training: "ATTENDED", extension_visit: "VISITED_BY", sale: "SOLD_TO",
    input_purchase: "PURCHASED_FROM", repayment: "REPAID", weather_damage: "EXPERIENCED",
    pest_outbreak: "EXPERIENCED", savings_deposit: "PARTICIPATES_IN",
  };
  for (const r of records ?? []) {
    const rel = relMap[r.record_type];
    if (!rel || !r.counterparty) continue;
    await runQuery(
      `MERGE (n:Entity {name:$name})
       WITH n MATCH (f:Farmer {id:$id})
       MERGE (f)-[r:${rel}]->(n)`,
      { id: farmerId, name: r.counterparty },
    );
  }
}
