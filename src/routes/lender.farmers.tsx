import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Accessibility, Search, SlidersHorizontal } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { APPLICANTS } from "@/lib/mock-data";

export const Route = createFileRoute("/lender/farmers")({
  component: FarmersDirectory,
});

function FarmersDirectory() {
  const [q, setQ] = useState("");
  const [climate, setClimate] = useState<string>("All");

  const list = useMemo(() => {
    return APPLICANTS.filter(
      (a) =>
        (climate === "All" || a.climate === climate) &&
        (q === "" || `${a.name} ${a.county} ${a.crop}`.toLowerCase().includes(q.toLowerCase())),
    );
  }, [q, climate]);

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Network" title="Farmer Directory" sub={`${APPLICANTS.length} farmers in your portfolio.`} />
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, county, crop…"
              className="h-9 w-full rounded-lg border border-border bg-surface-elevated/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald"
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-surface-elevated/60 p-1 text-xs">
            <SlidersHorizontal className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
            {["All", "Low", "Med", "High"].map((c) => (
              <button
                key={c}
                onClick={() => setClimate(c)}
                className={`rounded-md px-3 py-1.5 font-semibold transition ${climate === c ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title={`${list.length} farmers`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">County</th>
                <th className="px-3 py-2">Crop</th>
                <th className="px-3 py-2">Gender</th>
                <th className="px-3 py-2">Age</th>
                <th className="px-3 py-2">Farm size</th>
                <th className="px-3 py-2">Trust</th>
                <th className="px-3 py-2">Climate</th>
                <th className="px-3 py-2">Cooperative</th>
                <th className="px-3 py-2">A11y</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {list.map((a) => (
                <tr key={a.id} className="hover:bg-surface-elevated/40">
                  <td className="px-3 py-3">
                    <Link to="/lender/farmers/$id" params={{ id: a.id }} className="font-medium hover:text-emerald">
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{a.county}</td>
                  <td className="px-3 py-3">{a.crop}</td>
                  <td className="px-3 py-3 text-muted-foreground">{a.gender}</td>
                  <td className="px-3 py-3 text-muted-foreground">{a.age}</td>
                  <td className="px-3 py-3 text-muted-foreground">{a.farmSizeAcres} ac</td>
                  <td className="px-3 py-3 font-semibold">{a.score}</td>
                  <td className="px-3 py-3">
                    <Tag label={a.climate} tone={a.climate === "Low" ? "emerald" : a.climate === "Med" ? "gold" : "rose"} />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{a.cooperative}</td>
                  <td className="px-3 py-3">{a.disability ? <Accessibility className="h-4 w-4 text-violet" /> : <span className="text-muted-foreground">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
