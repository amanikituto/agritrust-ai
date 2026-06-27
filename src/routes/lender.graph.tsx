import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Network } from "lucide-react";
import { Card, NetworkGraph, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { getNetworkGraph } from "@/lib/graph.functions";

export const Route = createFileRoute("/lender/graph")({
  component: GraphPage,
});

const ALGOS = ["PageRank", "Centrality", "Community Detection", "Link Prediction", "Shortest Path", "Similarity"];

function GraphPage() {
  const [algo, setAlgo] = useState(ALGOS[0]);
  const fetchGraph = useServerFn(getNetworkGraph);
  const { data, isLoading } = useQuery({
    queryKey: ["graph", "lender"],
    queryFn: () => fetchGraph({ data: {} }),
  });
  const relByTarget = new Map((data?.links ?? []).map((l) => [l.target, l.rel]));
  const nodes = data?.nodes.map((n) => ({ id: n.id, label: n.label, type: n.type, rel: relByTarget.get(n.id) })) ?? [];

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Graph Intelligence" title="Neo4j Network Explorer" sub="Discover trust propagation, fraud rings and communities." />
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {ALGOS.map(a => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${algo === a ? "bg-emerald/15 text-emerald" : "bg-surface-elevated text-muted-foreground hover:text-foreground"}`}
            >
              {a}
            </button>
          ))}
        </div>
      </Card>
      <Card
        title={isLoading ? "Loading graph…" : `${algo} · ${nodes.length} nodes`}
        icon={Network}
        action={data?.source && <Tag label={data.source === "neo4j" ? "Live · Neo4j" : "Fallback"} tone={data.source === "neo4j" ? "emerald" : "gold"} />}
      >
        <NetworkGraph centerLabel={data?.center.label ?? "Hub"} nodes={nodes} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Tag label={`${nodes.length} connections`} tone="emerald" />
          <Tag label={`${data?.links.length ?? 0} relationships`} tone="sky" />
          <Tag label={algo} tone="violet" />
          {data?.error && <Tag label={data.error.slice(0, 40)} tone="rose" />}
        </div>
      </Card>
    </div>
  );
}
