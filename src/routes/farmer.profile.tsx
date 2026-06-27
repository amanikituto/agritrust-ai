import { createFileRoute } from "@tanstack/react-router";
import { User, Mail, Phone, MapPin, BadgeCheck } from "lucide-react";
import { Card, SectionTitle, Tag } from "@/components/dashboard/primitives";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/farmer/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string) ?? "John Kamau";
  const fields: [string, string, typeof User][] = [
    ["Full name", name, User],
    ["Email", user?.email ?? "john@example.com", Mail],
    ["Phone", "+254 700 000 100", Phone],
    ["County", "Kiambu, Kenya", MapPin],
    ["ID verified", "Verified · 24 Jan 2026", BadgeCheck],
  ];
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Account" title="My Profile" sub="Keep your details accurate to improve your Trust Score." />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card title="Personal information">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([l, v, Icon]) => (
              <div key={l} className="rounded-xl bg-surface-elevated/60 p-4">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" /> {l}
                </div>
                <div className="mt-1.5 text-sm font-medium">{v}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Identity status">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><span>National ID</span><Tag label="Verified" tone="emerald" /></div>
            <div className="flex items-center justify-between"><span>Mobile money KYC</span><Tag label="Verified" tone="emerald" /></div>
            <div className="flex items-center justify-between"><span>Biometric</span><Tag label="Optional" tone="sky" /></div>
            <div className="flex items-center justify-between"><span>Cooperative letter</span><Tag label="Pending" tone="gold" /></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
