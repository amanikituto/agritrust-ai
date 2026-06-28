import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Phone,
  Copy,
  CheckCircle2,
  ListOrdered,
  History,
  WifiOff,
  Smartphone,
} from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { UssdSimulator } from "@/components/farmer/UssdSimulator";
import { getMyRecentUssdSessions } from "@/lib/ussd.functions";

const DIAL = "*483*900#";

const MENU: { key: string; label: string; desc: string }[] = [
  { key: "1", label: "Apply for loan", desc: "Start a new loan request from your feature phone." },
  { key: "2", label: "Check trust score", desc: "Hear your current AgriTrust score and risk band." },
  { key: "3", label: "Loan status", desc: "Check pending and approved applications." },
  { key: "4", label: "Update records", desc: "Log a sale, harvest, repayment or input purchase." },
  { key: "5", label: "Climate alerts", desc: "Today's rainfall and 7-day weather advisory." },
  { key: "6", label: "Exit", desc: "End the USSD session." },
];

export const Route = createFileRoute("/farmer/ussd")({
  head: () => ({ meta: [{ title: "USSD Access · *483*900# · AgriTrust AI" }] }),
  component: FarmerUssdPage,
});

function FarmerUssdPage() {
  const fn = useServerFn(getMyRecentUssdSessions);
  const q = useQuery({ queryKey: ["ussd", "mine"], queryFn: () => fn() });
  const phone = q.data?.phone ?? null;
  const sessions = q.data?.sessions ?? [];

  return (
    <div className="space-y-8">
      <SectionTitle
        eyebrow="Last-mile accessibility"
        title="USSD access"
        sub="Use AgriTrust AI from any feature phone — no internet, no smartphone, no app required."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Tag label="Live on Africa's Talking sandbox" tone="emerald" />
            <Tag label="Works offline" tone="sky" />
          </div>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <DialCard phone={phone} loading={q.isLoading} />
        <MenuMap />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card title="Try it from the dashboard" icon={Smartphone}>
          <p className="mb-3 text-sm text-muted-foreground">
            Rehearse the USSD flow without dialling. Hits the same live endpoint Safaricom uses.
          </p>
          <UssdSimulator defaultPhone={phone ?? "+254700000000"} />
        </Card>

        <Card title="Your recent USSD sessions" icon={History}>
          {!phone ? (
            <EmptyState
              icon={Phone}
              title="No phone number on file"
              body="Add a phone number to your profile so we can match your USSD sessions to this account."
            />
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={WifiOff}
              title="No sessions yet"
              body={`Dial ${DIAL} from ${phone} to get started. Your sessions will appear here.`}
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{s.menu}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Last input: {s.last_input || "(menu)"}
                    </div>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function DialCard({ phone, loading }: { phone: string | null; loading: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(DIAL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <Card title="Dial code" icon={Phone}>
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <div className="text-5xl font-bold tracking-tight text-emerald">{DIAL}</div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href={`tel:${DIAL.replace(/#/g, "%23")}`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110"
          >
            <Phone className="h-4 w-4" /> Dial now
          </a>
          <button
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-xl glass-strong px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-elevated"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>
        <div className="grid w-full gap-2 rounded-xl bg-surface-elevated/60 p-4 text-left text-sm sm:grid-cols-2">
          <Field label="Registered phone" value={loading ? "…" : phone ?? "Not set"} />
          <Field label="Channel" value="Africa's Talking · Safaricom" />
          <Field label="Coverage" value="Kenya · 24/7" />
          <Field label="Cost" value="Standard USSD rates" />
        </div>
        {!phone && !loading && (
          <p className="text-xs text-muted-foreground">
            Add a phone number on your <span className="font-medium text-foreground">profile</span> so
            USSD sessions are linked to your account.
          </p>
        )}
      </div>
    </Card>
  );
}

function MenuMap() {
  return (
    <Card title="What you'll see when you dial" icon={ListOrdered}>
      <ol className="space-y-2">
        {MENU.map((m) => (
          <li key={m.key} className="flex items-start gap-3 rounded-xl bg-surface-elevated/60 p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald/10 font-mono text-sm font-bold text-emerald">
              {m.key}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium">{m.label}</div>
              <div className="text-xs text-muted-foreground">{m.desc}</div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="truncate font-medium">{value}</div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-elevated text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <div className="text-sm font-medium">{title}</div>
      <div className="max-w-xs text-xs text-muted-foreground">{body}</div>
    </div>
  );
}
