import { createFileRoute } from "@tanstack/react-router";
import { Mic, Send, Sparkles, Volume2 } from "lucide-react";
import { SectionTitle } from "@/components/dashboard/primitives";

export const Route = createFileRoute("/lender/assistant")({
  component: AssistantPage,
});

const MESSAGES = [
  { from: "ai", t: "I'm your lending copilot. Ask me to summarize the queue, compare applicants, or explain a recommendation." },
  { from: "user", t: "Which counties show rising climate risk this quarter?" },
  { from: "ai", t: "Machakos (+18%), Garissa (+22%) and Turkana (+15%) saw drought-index increases. Recommend stricter LTV ceilings or insurance bundling for new applications from these counties." },
];

function AssistantPage() {
  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Copilot" title="AI Assistant" sub="Enterprise copilot · EN/SW · voice-enabled" />
      <div className="rounded-2xl glass">
        <div className="space-y-4 p-5 min-h-[440px]">
          {MESSAGES.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.from === "user" ? "flex-row-reverse" : ""}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${m.from === "ai" ? "bg-gradient-to-br from-emerald to-violet" : "bg-surface-elevated"}`}>
                {m.from === "ai" ? <Sparkles className="h-4 w-4 text-primary-foreground" /> : <span className="text-xs font-bold">L</span>}
              </span>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.from === "user" ? "bg-primary text-primary-foreground" : "bg-surface-elevated/60"}`}>
                {m.t}
                {m.from === "ai" && <button className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-elevated"><Volume2 className="h-3.5 w-3.5" /></button>}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border/60 p-4">
          <div className="flex items-center gap-2 rounded-xl bg-surface-elevated/60 px-3 py-2">
            <button className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-elevated"><Mic className="h-4 w-4" /></button>
            <input className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Ask the copilot…" />
            <button className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Summarize the queue","Compare A. Wanjiku vs J. Mwangi","Risky portfolios","Generate portfolio report","Policy: women in agri"].map(s => (
              <button key={s} className="rounded-full bg-emerald/10 px-3 py-1 text-xs text-emerald hover:bg-emerald/20">{s}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
