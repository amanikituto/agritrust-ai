import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type GraphNode = { id: string; label: string; type: string };
export type GraphLink = { source: string; target: string; rel: string; weight?: number };
export type GraphData = {
  center: GraphNode;
  nodes: GraphNode[];
  links: GraphLink[];
  source: "neo4j" | "fallback";
  error?: string;
};

const FALLBACK: GraphData = {
  center: { id: "you", label: "You", type: "Farmer" },
  nodes: [
    { id: "coop", label: "Cooperative", type: "Cooperative" },
    { id: "bank", label: "Bank", type: "Lender" },
    { id: "buyer", label: "Buyer", type: "Buyer" },
    { id: "inputs", label: "Inputs", type: "InputSupplier" },
    { id: "weather", label: "Climate", type: "ClimateEvent" },
    { id: "officer", label: "Officer", type: "ExtensionOfficer" },
    { id: "savings", label: "Savings Group", type: "SavingsGroup" },
    { id: "training", label: "Training", type: "Training" },
  ],
  links: [
    { source: "you", target: "coop", rel: "MEMBER_OF" },
    { source: "you", target: "bank", rel: "APPLIED_FOR" },
    { source: "you", target: "buyer", rel: "SOLD_TO" },
    { source: "you", target: "inputs", rel: "PURCHASED_FROM" },
    { source: "you", target: "weather", rel: "EXPERIENCED" },
    { source: "you", target: "officer", rel: "VISITED_BY" },
    { source: "you", target: "savings", rel: "PARTICIPATES_IN" },
    { source: "you", target: "training", rel: "ATTENDED" },
  ],
  source: "fallback",
};

/**
 * Idempotently MERGEs a farmer's full graph from Supabase records.
 * Best-effort: returns ok:false on any failure without raising to the caller.
 */
export const seedFarmerGraph = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { farmerId?: string }) => d ?? {})
  .handler(async ({ data, context }) => {
    const farmerId = data.farmerId ?? context.userId;
    try {
      const [{ data: fp }, { data: profile }, { data: loans }, { data: records }] = await Promise.all([
        context.supabase.from("farmer_profiles").select("*").eq("id", farmerId).maybeSingle(),
        context.supabase.from("profiles").select("full_name, phone").eq("id", farmerId).maybeSingle(),
        context.supabase.from("loan_applications").select("id, amount_kes, status, lender_id").eq("farmer_id", farmerId),
        context.supabase.from("farm_records").select("record_type, counterparty, amount_kes").eq("farmer_id", farmerId).limit(100),
      ]);

      const { runQuery } = await import("./neo4j.server");
      const name = profile?.full_name ?? "Farmer";

      await runQuery(
        `MERGE (f:Farmer {id:$id})
         SET f.name=$name, f.county=$county, f.gender=$gender, f.cooperative=$coop`,
        {
          id: farmerId,
          name,
          county: fp?.county ?? null,
          gender: fp?.gender ?? null,
          coop: fp?.cooperative ?? null,
        },
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
      for (const risk of fp?.climate_risks ?? []) {
        await runQuery(
          `MERGE (e:ClimateEvent {name:$risk})
           WITH e MATCH (f:Farmer {id:$id})
           MERGE (f)-[:EXPERIENCED]->(e)`,
          { id: farmerId, risk },
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
        training: "ATTENDED",
        extension_visit: "VISITED_BY",
        sale: "SOLD_TO",
        input_purchase: "PURCHASED_FROM",
        repayment: "REPAID",
        weather_damage: "EXPERIENCED",
        pest_outbreak: "EXPERIENCED",
        savings_deposit: "PARTICIPATES_IN",
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
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "neo4j unavailable" };
    }
  });

export const getNetworkGraph = createServerFn({ method: "GET" })
  .inputValidator((d: { centerId?: string } | undefined) => d ?? {})
  .handler(async ({ data }): Promise<GraphData> => {
    try {
      const { runQuery } = await import("./neo4j.server");
      const centerId = data.centerId;
      const cypher = centerId
        ? `MATCH (c:Farmer {id:$centerId})-[r]-(n)
           RETURN c, collect(DISTINCT {node:n, rel:type(r)})[..18] AS rels LIMIT 1`
        : `MATCH (c:Farmer)-[r]-(n)
           WITH c, collect(DISTINCT {node:n, rel:type(r)})[..16] AS rels
           RETURN c, rels LIMIT 1`;
      const rows = await runQuery<{ c: any; rels: { node: any; rel: string }[] }>(cypher, centerId ? { centerId } : {});
      if (!rows.length) return FALLBACK;
      const r0 = rows[0];
      const cProps = r0.c?.properties ?? {};
      const center: GraphNode = {
        id: String(cProps.id ?? r0.c?.identity ?? "center"),
        label: String(cProps.name ?? cProps.label ?? "Farmer"),
        type: (r0.c?.labels?.[0] ?? "Farmer") as string,
      };
      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      for (const { node, rel } of r0.rels) {
        const p = node?.properties ?? {};
        const id = String(p.id ?? p.name ?? node?.identity ?? Math.random());
        const label = String(p.name ?? p.label ?? (node?.labels?.[0] ?? "Node"));
        const type = (node?.labels?.[0] ?? "Node") as string;
        nodes.push({ id, label, type });
        links.push({ source: center.id, target: id, rel });
      }
      return { center, nodes, links, source: "neo4j" };
    } catch (err) {
      return { ...FALLBACK, error: err instanceof Error ? err.message : "Neo4j unavailable" };
    }
  });
