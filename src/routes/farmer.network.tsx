import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Network, Search, ZoomIn, ZoomOut } from "lucide-react";
import { Card, NetworkGraph, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { getNetworkGraph } from "@/lib/graph.functions";

export const Route = createFileRoute("/farmer/network")({
  component: NetworkPage,
});

function NetworkPage() {
  const fetchGraph = useServerFn(getNetworkGraph);
  const { data, isLoading } = useQuery({
    queryKey: ["graph", "farmer"],
    queryFn: () => fetchGraph({ data: {} }),
  });

  const nodes = data?.nodes.map((n) => ({ label: n.label, type: n.type })) ?? [];
  const center = data?.center.label ?? "You";

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Graph AI" title="Relationship Network" sub="Live trust network powered by Neo4j." />
      <Card
        icon={Network}
        title={isLoading ? "Loading network…" : `Your ecosystem · ${nodes.length} connections`}
        action={
          <div className="flex items-center gap-1">
            {data?.source && <Tag label={data.source === "neo4j" ? "Live · Neo4j" : "Fallback"} tone={data.source === "neo4j" ? "emerald" : "gold"} />}
            <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-elevated"><Search className="h-3.5 w-3.5" /></button>
            <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-elevated"><ZoomIn className="h-3.5 w-3.5" /></button>
            <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-elevated"><ZoomOut className="h-3.5 w-3.5" /></button>
          </div>
        }
      >
        <NetworkGraph centerLabel={center} nodes={nodes} />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Strongest ties">
          <ul className="divide-y divide-border/60 text-sm">
            {(data?.links ?? []).slice(0, 6).map((l, i) => {
              const target = data?.nodes.find((n) => n.id === l.target);
              return (
                <li key={i} className="flex items-center justify-between py-3">
                  <span>{target?.label ?? l.target}</span>
                  <span className="text-xs text-muted-foreground">{l.rel}</span>
                </li>
              );
            })}
            {!data?.links.length && !isLoading && (
              <li className="py-3 text-xs text-muted-foreground">No relationships found in the graph yet.</li>
            )}
          </ul>
        </Card>
        <Card title="Trust propagation">
          <p className="text-sm text-muted-foreground">
            Trust scores propagate from your cooperative and high-trust neighbours through the Neo4j relationship graph. Strong, diverse ties increase your individual score.
          </p>
          {data?.error && <p className="mt-2 text-xs text-rose">{data.error}</p>}
        </Card>
      </div>
    </div>
  );
}
