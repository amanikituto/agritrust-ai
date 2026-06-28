import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Accessibility, Eye } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { listAllApplications } from "@/lib/loans.functions";

export const Route = createFileRoute("/lender/applications")({
  component: ApplicationsList,
});

const TONE: Record<string, "sky" | "emerald" | "rose" | "gold"> = {
  submitted: "sky", under_review: "sky", approved: "emerald",
  disbursed: "emerald", repaid: "emerald", rejected: "rose", draft: "gold",
};

function ApplicationsList() {
  const fn = useServerFn(listAllApplications);
  const apps = useQuery({ queryKey: ["lender", "applications"], queryFn: () => fn() });

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Queue" title="Loan Applications"
        sub={`${apps.data?.length ?? 0} applications waiting on a decision.`} />
      <Card>
        {apps.isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading…</p> :
          (apps.data ?? []).length === 0 ? <p className="p-4 text-sm text-muted-foreground">No applications yet.</p> :
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">Applicant</th><th className="px-3 py-2">County</th>
                  <th className="px-3 py-2">Trust</th><th className="px-3 py-2">Climate</th>
                  <th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">AI Rec</th><th className="px-3 py-2">Conf.</th>
                  <th className="px-3 py-2">A11y</th><th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(apps.data ?? []).map((a) => (
                  <tr key={a.id} className="hover:bg-surface-elevated/40">
                    <td className="px-3 py-3 font-medium">
                      <span>{a.farmer_name}</span>
                      {(a as any).source === "ussd" && <Tag label="USSD" tone="violet" />}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">{a.county}</td>
                    <td className="px-3 py-3 font-semibold">{a.trust_score_snapshot ?? "—"}</td>
                    <td className="px-3 py-3">
                      <Tag label={a.climate_risk_snapshot ?? "—"} tone={a.climate_risk_snapshot === "low" ? "emerald" : a.climate_risk_snapshot === "high" ? "rose" : "gold"} />
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">KES {Number(a.amount_kes).toLocaleString()}</td>
                    <td className="px-3 py-3"><Tag label={a.status} tone={TONE[a.status] ?? "sky"} /></td>
                    <td className="px-3 py-3"><Tag label={a.ai_recommendation ?? "—"} tone={a.ai_recommendation === "approve" ? "emerald" : a.ai_recommendation === "decline" ? "rose" : "sky"} /></td>
                    <td className="px-3 py-3 text-muted-foreground">{a.ai_confidence ? `${(a.ai_confidence * 100).toFixed(0)}%` : "—"}</td>
                    <td className="px-3 py-3">{a.has_disability ? <Accessibility className="h-4 w-4 text-violet" /> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-3">
                      <Link to="/lender/applications/$id" params={{ id: a.id }} className="inline-flex items-center gap-1.5 rounded-md bg-emerald/10 px-2.5 py-1.5 text-xs font-semibold text-emerald hover:bg-emerald/20">
                        <Eye className="h-3.5 w-3.5" /> Review
                      </Link>
                    </td>
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
