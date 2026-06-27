import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { LENDER_NOTIFICATIONS } from "@/lib/mock-data";

export const Route = createFileRoute("/lender/notifications")({
  component: NotificationsPage,
});

const TONE: Record<string, "emerald" | "sky" | "gold" | "violet" | "rose"> = {
  Queue: "sky",
  Climate: "gold",
  Compliance: "emerald",
  Performance: "emerald",
  Policy: "violet",
};

function NotificationsPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Inbox" title="Notifications" sub="Operations, risk and compliance updates." />
      <Card icon={Bell} title={`${LENDER_NOTIFICATIONS.length} updates`}>
        <ul className="divide-y divide-border/60">
          {LENDER_NOTIFICATIONS.map((n) => (
            <li key={n.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm">{n.t}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{n.time}</div>
              </div>
              <Tag label={n.k} tone={TONE[n.k] ?? "sky"} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
