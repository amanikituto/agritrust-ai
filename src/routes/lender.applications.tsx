import { createFileRoute, Link } from "@tanstack/react-router";
import { Accessibility, Eye } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { APPLICANTS } from "@/lib/mock-data";

export const Route = createFileRoute("/lender/applications")({
  component: ApplicationsList,
});

function ApplicationsList() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Queue" title="Loan Applications" sub={`${APPLICANTS.length} applications waiting on a decision.`} />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Applicant</th>
                <th className="px-3 py-2">County</th>
                <th className="px-3 py-2">Trust</th>
                <th className="px-3 py-2">Climate</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">AI Rec</th>
                <th className="px-3 py-2">Conf.</th>
                <th className="px-3 py-2">A11y</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {APPLICANTS.map((a) => (
                <tr key={a.id} className="hover:bg-surface-elevated/40">
                  <td className="px-3 py-3 font-medium">{a.name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{a.county}</td>
                  <td className="px-3 py-3 font-semibold">{a.score}</td>
                  <td className="px-3 py-3">
                    <Tag label={a.climate} tone={a.climate === "Low" ? "emerald" : a.climate === "Med" ? "gold" : "rose"} />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">KES {a.amount.toLocaleString()}</td>
                  <td className="px-3 py-3"><Tag label={a.status} tone={a.status === "Approved" ? "emerald" : a.status === "Declined" ? "rose" : "sky"} /></td>
                  <td className="px-3 py-3"><Tag label={a.rec} tone={a.rec === "Approve" ? "emerald" : a.rec === "Decline" ? "rose" : "sky"} /></td>
                  <td className="px-3 py-3 text-muted-foreground">{(a.conf * 100).toFixed(0)}%</td>
                  <td className="px-3 py-3">{a.disability ? <Accessibility className="h-4 w-4 text-violet" /> : <span className="text-muted-foreground">—</span>}</td>
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
      </Card>
    </div>
  );
}
