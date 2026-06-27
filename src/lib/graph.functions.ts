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
  center: { id: "you", label: "You", type: "Farmer" },
  nodes: [
    { id: "coop", label: "Cooperative", type: "Cooperative" },
    { id: "bank", label: "Bank", type: "Lender" },
    { id: "buyer", label: "Buyer", type: "Market" },
    { id: "inputs", label: "Inputs", type: "Supplier" },
    { id: "weather", label: "Weather", type: "Climate" },
    { id: "officer", label: "Officer", type: "Officer" },
    { id: "market", label: "Market", type: "Market" },
    { id: "neighbor", label: "Neighbor", type: "Peer" },
  ],
  links: [],
  source: "fallback",
};

export const getNetworkGraph = createServerFn({ method: "GET" })
  .inputValidator((d: { centerId?: string } | undefined) => d ?? {})
  .handler(async ({ data }): Promise<GraphData> => {
    try {
      const { runQuery } = await import("./neo4j.server");
      const centerId = data.centerId;
      const cypher = centerId
        ? `MATCH (c {id:$centerId})-[r]-(n)
           RETURN c, collect(DISTINCT {node:n, rel:type(r)}) AS rels LIMIT 1`
        : `MATCH (c:Farmer)-[r]-(n)
           WITH c, collect(DISTINCT {node:n, rel:type(r)})[..12] AS rels
           RETURN c, rels LIMIT 1`;
      const rows = await runQuery<{ c: any; rels: { node: any; rel: string }[] }>(cypher, centerId ? { centerId } : {});
      if (!rows.length) return FALLBACK;
      const r0 = rows[0];
      const cProps = r0.c?.properties ?? {};
      const center: GraphNode = {
        id: String(cProps.id ?? r0.c?.identity ?? "center"),
        label: String(cProps.name ?? cProps.label ?? "Center"),
        type: (r0.c?.labels?.[0] ?? "Farmer") as string,
      };
      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];
      for (const { node, rel } of r0.rels) {
        const p = node?.properties ?? {};
        const id = String(p.id ?? node?.identity ?? Math.random());
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
