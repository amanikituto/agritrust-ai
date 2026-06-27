import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Accessibility, Search, SlidersHorizontal } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { listFarmersDirectory } from "@/lib/farmer-data.functions";

export const Route = createFileRoute("/lender/farmers")({
  component: FarmersDirectory,
});

function FarmersDirectory() {
  const fn = useServerFn(listFarmersDirectory);
  const farmers = useQuery({ queryKey: ["lender", "farmers"], queryFn: () => fn() });

  const [q, setQ] = useState("");
  const [climate, setClimate] = useState<string>("All");

  useEffect(() => {
    const pending = sessionStorage.getItem("agritrust:dashboard-search");
    if (pending) {
      setQ(pending);
      sessionStorage.removeItem("agritrust:dashboard-search");
    }
  }, []);

  const list = useMemo(() => {
    return (farmers.data ?? []).filter(
      (a) =>
        (climate === "All" || (a.climate_risk ?? "").toLowerCase() === climate.toLowerCase()) &&
        (q === "" || `${a.name} ${a.county ?? ""} ${(a.crops ?? []).join(" ")}`.toLowerCase().includes(q.toLowerCase())),
    );
  }, [q, climate, farmers.data]);

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Network" title="Farmer Directory" sub={`${farmers.data?.length ?? 0} farmers in your portfolio.`} />
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, county, crop…"
              className="h-9 w-full rounded-lg border border-border bg-surface-elevated/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald" />
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-elevated/60 p-1 text-xs">
            <SlidersHorizontal className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
            {["All", "low", "medium", "high"].map((c) => (
              <button key={c} onClick={() => setClimate(c)}
                className={`rounded-md px-3 py-1.5 font-semibold transition ${climate === c ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {c === "All" ? "All" : c[0].toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title={`${list.length} farmers`}>
        {farmers.isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading…</p> :
          list.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No farmers match.</p> :
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">Name</th><th className="px-3 py-2">County</th>
                  <th className="px-3 py-2">Crops</th><th className="px-3 py-2">Gender</th>
                  <th className="px-3 py-2">Farm size</th><th className="px-3 py-2">Trust</th>
                  <th className="px-3 py-2">Climate</th><th className="px-3 py-2">Cooperative</th>
                  <th className="px-3 py-2">A11y</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {list.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-elevated/40">
                    <td className="px-3 py-3">
                      <Link to="/lender/farmers/$id" params={{ id: a.id }} className="font-medium hover:text-emerald">{a.name}</Link>
                      {!a.onboarded && <Tag label="Onboarding" tone="gold" />}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{a.county ?? "—"}</td>
                    <td className="px-3 py-3">{(a.crops ?? []).join(", ") || "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{a.gender ?? "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground">{a.farm_size_acres ?? "—"} ac</td>
                    <td className="px-3 py-3 font-semibold">{a.score ?? "—"}</td>
                    <td className="px-3 py-3"><Tag label={a.climate_risk ?? "—"} tone={a.climate_risk === "low" ? "emerald" : a.climate_risk === "high" ? "rose" : "gold"} /></td>
                    <td className="px-3 py-3 text-muted-foreground">{a.cooperative ?? "—"}</td>
                    <td className="px-3 py-3">{a.has_disability ? <Accessibility className="h-4 w-4 text-violet" /> : <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </Card>
    </div>
  );
}
