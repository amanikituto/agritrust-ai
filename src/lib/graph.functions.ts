import { createServerFn } from "@tanstack/react-start";

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
  center: { id: "demo", label: "Farmer", type: "Farmer" },
  nodes: [
    { id: "coop", label: "Cooperative", type: "Cooperative" },
    { id: "bank", label: "Bank", type: "Lender" },
    { id: "buyer", label: "Buyer", type: "Buyer" },
    { id: "inputs", label: "Inputs", type: "InputSupplier" },
    { id: "weather", label: "Climate", type: "ClimateEvent" },
    { id: "officer", label: "Officer", type: "ExtensionOfficer" },
    { id: "savings", label: "Savings", type: "SavingsGroup" },
    { id: "training", label: "Training", type: "Training" },
  ],
  links: [
    { source: "demo", target: "coop", rel: "MEMBER_OF" },
    { source: "demo", target: "bank", rel: "APPLIED_FOR" },
    { source: "demo", target: "buyer", rel: "SOLD_TO" },
    { source: "demo", target: "inputs", rel: "PURCHASED_FROM" },
    { source: "demo", target: "weather", rel: "EXPERIENCED" },
    { source: "demo", target: "officer", rel: "VISITED_BY" },
    { source: "demo", target: "savings", rel: "PARTICIPATES_IN" },
    { source: "demo", target: "training", rel: "ATTENDED" },
  ],
  source: "fallback",
};

export const getFarmerGraph = createServerFn({ method: "GET" })
  .inputValidator((d: { farmerId: string }) => d)
  .handler(async ({ data }): Promise<GraphData> => {
    try {
      const { runQuery } = await import("./neo4j.server");
      const rows = await runQuery<{ c: { properties?: Record<string, unknown>; labels?: string[]; identity?: number }; rels: { node: { properties?: Record<string, unknown>; labels?: string[]; identity?: number }; rel: string }[] }>(
        `MATCH (c:Farmer {id:$id})
         OPTIONAL MATCH (c)-[r]-(n)
         WITH c, collect(DISTINCT {node:n, rel:type(r)})[..18] AS rels
         RETURN c, rels LIMIT 1`,
        { id: data.farmerId },
      );
      if (!rows.length || !rows[0].c) return FALLBACK;
      const r0 = rows[0];
      const cProps = (r0.c.properties ?? {}) as Record<string, string>;
      const center: GraphNode = {
        id: String(cProps.id ?? "center"),
        label: String(cProps.name ?? "Farmer"),
        type: "Farmer",
      };
      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      for (const { node, rel } of r0.rels ?? []) {
        if (!node) continue;
        const p = (node.properties ?? {}) as Record<string, string>;
        const id = String(p.id ?? p.name ?? Math.random());
        const label = String(p.name ?? p.label ?? (node.labels?.[0] ?? "Node"));
        const type = (node.labels?.[0] ?? "Node") as string;
        nodes.push({ id, label, type });
        links.push({ source: center.id, target: id, rel });
      }
      if (nodes.length === 0) return FALLBACK;
      return { center, nodes, links, source: "neo4j" };
    } catch (err) {
      return { ...FALLBACK, error: err instanceof Error ? err.message : "Neo4j unavailable" };
    }
  });
