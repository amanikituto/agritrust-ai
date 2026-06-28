import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Network } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { RelationshipGraph } from "@/components/RelationshipGraph";
import { getFarmerGraph } from "@/lib/graph.functions";

export const Route = createFileRoute("/graph/$farmerId")({
  head: () => ({ meta: [{ title: "Relationship Graph · AgriTrust AI" }] }),
  component: GraphPage,
});

function GraphPage() {
  const { farmerId } = Route.useParams();
  const q = useQuery({
    queryKey: ["graph", farmerId],
    queryFn: () => getFarmerGraph({ data: { farmerId } }),
  });
  const data = q.data;

  return (
    <div className="min-h-dvh">
      <SiteHeader variant="app" />
      <main className="container-page py-8">
        <Link to="/lender" className="btn-ghost"><ArrowLeft className="h-4 w-4" /> Back</Link>
        <div className="mt-2 flex items-center gap-3">
          <Network className="h-7 w-7 text-leaf" />
          <h1 className="font-display text-3xl font-bold text-leaf">Relationship Graph</h1>
        </div>
        {data?.source === "fallback" && (
          <p className="mt-3 rounded-lg bg-sun-soft/60 p-3 text-sm text-earth">
            Graph intelligence is running in demo mode {data.error ? `· ${data.error}` : ""}.
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="card-soft p-4 lg:col-span-2">
            {data ? <RelationshipGraph data={data} /> : <div className="py-20 text-center text-charcoal/60">Loading graph…</div>}
          </div>
          <div className="card-soft p-6">
            <h3 className="font-display font-bold">What this graph answers</h3>
            <ul className="mt-3 space-y-2 text-sm text-charcoal/80">
              <li>• Is this farmer connected to trusted networks?</li>
              <li>• Do they have repayment behaviour?</li>
              <li>• Are they commercially active (buyers & suppliers)?</li>
              <li>• Are they climate exposed?</li>
              <li>• Are they part of a cooperative or savings group?</li>
            </ul>
            <h3 className="mt-6 font-display font-bold">Connected entities</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {(data?.nodes ?? []).map((n, i) => (
                <li key={n.id + i} className="flex justify-between border-b border-border/60 pb-1 last:border-0">
                  <span>{n.label}</span>
                  <span className="text-xs text-charcoal/60">{n.type}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
