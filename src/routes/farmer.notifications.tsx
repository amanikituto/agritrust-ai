import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { NOTIFICATIONS } from "@/lib/mock-data";

export const Route = createFileRoute("/farmer/notifications")({
  component: NotificationsPage,
});

const TONE: Record<string, "emerald" | "sky" | "gold" | "violet" | "rose"> = {
  Climate: "sky",
  Loan: "emerald",
  Reminder: "gold",
  Training: "violet",
  Achievement: "emerald",
  Trust: "emerald",
};

function NotificationsPage() {
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Inbox" title="Notifications" sub="Real-time updates from AgriTrust AI." />
      <Card icon={Bell} title={`${NOTIFICATIONS.length} new updates`}>
        <ul className="divide-y divide-border/60">
          {NOTIFICATIONS.map((n) => (
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
