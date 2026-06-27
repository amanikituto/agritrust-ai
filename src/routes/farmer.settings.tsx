import { createFileRoute } from "@tanstack/react-router";
import { Card, SectionTitle } from "@/components/dashboard/primitives";
import { useA11y } from "@/lib/accessibility";

export const Route = createFileRoute("/farmer/settings")({
  component: SettingsPage,
});

function Row({ label, on, onChange, desc }: { label: string; on: boolean; onChange: () => void; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <button
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-emerald" : "bg-surface-elevated"}`}
        aria-pressed={on}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition ${on ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function SettingsPage() {
  const a = useA11y();
  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Preferences" title="Settings" sub="Personalize how AgriTrust AI works for you." />
      <Card title="Accessibility">
        <div className="divide-y divide-border/60">
          <Row label="Large text" desc="Increase base font size for easier reading." on={a.largeText} onChange={() => a.toggle("largeText")} />
          <Row label="High contrast" desc="Maximum contrast for low-vision users." on={a.highContrast} onChange={() => a.toggle("highContrast")} />
          <Row label="Dyslexia-friendly font" desc="Switch to Atkinson Hyperlegible." on={a.dyslexiaFont} onChange={() => a.toggle("dyslexiaFont")} />
          <Row label="Reduce motion" desc="Disable non-essential animations." on={a.reduceMotion} onChange={() => a.toggle("reduceMotion")} />
        </div>
      </Card>
      <Card title="Language">
        <div className="flex gap-2">
          <button className="rounded-lg bg-emerald/10 px-4 py-2 text-sm font-semibold text-emerald">English</button>
          <button className="rounded-lg bg-surface-elevated px-4 py-2 text-sm font-semibold">Kiswahili</button>
        </div>
      </Card>
    </div>
  );
}
