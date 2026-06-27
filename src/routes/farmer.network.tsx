import { createFileRoute } from "@tanstack/react-router";
import { Network, Search, ZoomIn, ZoomOut } from "lucide-react";
import { Card, NetworkGraph, SectionTitle } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/farmer/network")({
  component: NetworkPage,
});

function NetworkPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Graph AI" title="Relationship Network" sub="Your trust network powered by Neo4j." />
      <Card
        icon={Network}
        title="Your ecosystem"
        action={
          <div className="flex items-center gap-1">
            <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-elevated"><Search className="h-3.5 w-3.5" /></button>
            <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-elevated"><ZoomIn className="h-3.5 w-3.5" /></button>
            <button className="grid h-7 w-7 place-items-center rounded-md hover:bg-surface-elevated"><ZoomOut className="h-3.5 w-3.5" /></button>
          </div>
        }
      >
        <NetworkGraph centerLabel="You" />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Strongest ties">
          <ul className="divide-y divide-border/60 text-sm">
            {[["Kiambu Coffee Coop","Member 5y"],["KCB Bank","Borrowed × 3"],["Twiga Foods","Sold 12 t"],["Agrovet Ltd","Bought inputs × 8"]].map(([n,r]) => (
              <li key={n} className="flex items-center justify-between py-3"><span>{n}</span><span className="text-xs text-muted-foreground">{r}</span></li>
            ))}
          </ul>
        </Card>
        <Card title="Trust propagation">
          <p className="text-sm text-muted-foreground">Your cooperative trust score (88) lifts your individual score by +0.18. Strong connection to 3 high-trust neighbors adds another +0.06.</p>
        </Card>
      </div>
    </div>
  );
}
