import { createFileRoute } from "@tanstack/react-router";
import { SectionTitle } from "@/components/dashboard/primitives";
import { UssdSimulator } from "@/components/farmer/UssdSimulator";

export const Route = createFileRoute("/ussd-sim")({
  head: () => ({ meta: [{ title: "USSD Simulator · *483*900#" }] }),
  component: UssdSim,
});

function UssdSim() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <SectionTitle
        eyebrow="Last-mile accessibility"
        title="USSD Simulator · *483*900#"
        sub="Test the offline lending flow that runs on any feature phone."
      />
      <UssdSimulator />
    </div>
  );
}

