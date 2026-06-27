import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Bot, ExternalLink, Receipt, Sparkles, Wallet } from "lucide-react";
import { Card, KpiCard, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { listFarmersDirectory } from "@/lib/farmer-data.functions";
import { lenderRequestFarmerProfile, listAgentInfo, listMyAgentJobs } from "@/lib/agent.functions";

export const Route = createFileRoute("/lender/agent")({
  component: AgentPage,
});

type Tier = "basic" | "standard" | "premium";

function AgentPage() {
  const qc = useQueryClient();
  const infoFn = useServerFn(listAgentInfo);
  const listFn = useServerFn(listFarmersDirectory);
  const jobsFn = useServerFn(listMyAgentJobs);
  const invokeFn = useServerFn(lenderRequestFarmerProfile);

  const info = useQuery({ queryKey: ["agent", "info"], queryFn: () => infoFn() });
  const farmers = useQuery({ queryKey: ["lender", "farmers"], queryFn: () => listFn() });
  const jobs = useQuery({ queryKey: ["agent", "jobs"], queryFn: () => jobsFn() });

  const [farmerId, setFarmerId] = useState<string>("");
  const [tier, setTier] = useState<Tier>("standard");
  const [result, setResult] = useState<Awaited<ReturnType<typeof invokeFn>> | null>(null);

  const farmerOptions = useMemo(() => farmers.data ?? [], [farmers.data]);
  const price = info.data?.pricing[tier] ?? 0;

  const buy = useMutation({
    mutationFn: () => invokeFn({ data: { farmerId, tier } }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["agent", "jobs"] });
    },
  });

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Masumi · Agent-to-Agent"
        title="AgriTrust Credit Intelligence Agent"
        sub="Pay the AgriTrust agent via Masumi to receive a tiered, audit-signed credit profile for any farmer in the directory."
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Basic" value={`KES ${info.data?.pricing.basic ?? "—"}`} sub="Score + recommendation" tone="sky" icon={Wallet} />
        <KpiCard label="Standard" value={`KES ${info.data?.pricing.standard ?? "—"}`} sub="+ identity & farm summary" tone="emerald" icon={Wallet} />
        <KpiCard label="Premium" value={`KES ${info.data?.pricing.premium ?? "—"}`} sub="+ Neo4j relationship signals" tone="gold" icon={Wallet} />
      </section>

      <Card title="Pay & fetch a farmer profile" icon={Bot}>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
          <select
            value={farmerId}
            onChange={(e) => setFarmerId(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface-elevated px-3 text-sm"
          >
            <option value="">Select a farmer…</option>
            {farmerOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}{f.county ? ` · ${f.county}` : ""}
              </option>
            ))}
          </select>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as Tier)}
            className="h-10 rounded-lg border border-border bg-surface-elevated px-3 text-sm"
          >
            <option value="basic">Basic · KES {info.data?.pricing.basic ?? "—"}</option>
            <option value="standard">Standard · KES {info.data?.pricing.standard ?? "—"}</option>
            <option value="premium">Premium · KES {info.data?.pricing.premium ?? "—"}</option>
          </select>
          <button
            disabled={!farmerId || buy.isPending}
            onClick={() => buy.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:brightness-110 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> {buy.isPending ? "Paying…" : `Pay KES ${price} & fetch`}
          </button>
        </div>
        {buy.isError && (
          <p className="mt-3 text-sm text-rose">{(buy.error as Error).message}</p>
        )}
      </Card>

      {result && (
        <Card
          title={`Result · ${result.profile.recommendation.toUpperCase()}`}
          icon={BadgeCheck}
          action={<Tag label={result.invocation.isMocked ? "MOCKED" : "LIVE"} tone={result.invocation.isMocked ? "gold" : "emerald"} />}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-elevated/60 p-3 text-sm">
              <div className="text-xs uppercase text-muted-foreground">Masumi job</div>
              <div className="font-mono text-xs">{result.invocation.jobId}</div>
              <a href={result.invocation.explorerUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-emerald hover:underline">
                Escrow tx <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="rounded-xl bg-surface-elevated/60 p-3 text-sm">
              <div className="text-xs uppercase text-muted-foreground">Outbound agent payment (AgriTrust → Climate)</div>
              <div className="font-mono text-xs truncate">{result.climate.tx}</div>
              <a href={result.climate.explorerUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-emerald hover:underline">
                Climate tx <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs uppercase text-muted-foreground mb-2">Profile</div>
            <pre className="overflow-x-auto rounded-xl bg-surface-elevated/60 p-3 text-xs">{JSON.stringify(result.profile, null, 2)}</pre>
          </div>
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
            <Receipt className="h-3.5 w-3.5" /> Signed receipt: <span className="font-mono truncate">{result.signature.slice(0, 32)}…</span>
          </div>
        </Card>
      )}

      <Card title="My agent jobs" icon={Receipt}>
        {jobs.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (jobs.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs yet — your purchases will appear here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Tier</th>
                  <th className="px-3 py-2">KES</th>
                  <th className="px-3 py-2">Job</th>
                  <th className="px-3 py-2">Escrow</th>
                  <th className="px-3 py-2">Outbound</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(jobs.data ?? []).map((j) => (
                  <tr key={j.id}>
                    <td className="px-3 py-2 text-muted-foreground">{new Date(j.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2"><Tag label={j.tier} tone="sky" /></td>
                    <td className="px-3 py-2 font-mono text-xs">{j.amount_kes}</td>
                    <td className="px-3 py-2 font-mono text-xs">{j.masumi_job_id}</td>
                    <td className="px-3 py-2">
                      {j.explorer_url ? (
                        <a className="text-emerald hover:underline inline-flex items-center gap-1" href={j.explorer_url} target="_blank" rel="noreferrer">tx <ExternalLink className="h-3 w-3" /></a>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {j.outbound_explorer_url ? (
                        <a className="text-emerald hover:underline inline-flex items-center gap-1" href={j.outbound_explorer_url} target="_blank" rel="noreferrer">tx <ExternalLink className="h-3 w-3" /></a>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
