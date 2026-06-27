import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Network } from "lucide-react";
import { Card, NetworkGraph, SectionTitle, Tag } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/lender/graph")({
  component: GraphPage,
});

const ALGOS = ["PageRank", "Centrality", "Community Detection", "Link Prediction", "Shortest Path", "Similarity"];

function GraphPage() {
  const [algo, setAlgo] = useState(ALGOS[0]);
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
      <Card title={`${algo} visualization`} icon={Network}>
        <NetworkGraph centerLabel="Hub" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Tag label="Trust propagation +0.18" tone="emerald" />
          <Tag label="Community size 240" tone="sky" />
          <Tag label="Centrality rank #12" tone="gold" />
          <Tag label="No fraud cluster" tone="violet" />
        </div>
      </Card>
    </div>
  );
}
