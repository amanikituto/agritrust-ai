import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Send, Sparkles } from "lucide-react";
import { SectionTitle } from "@/components/dashboard/primitives";
import { askAssistant } from "@/lib/ai.functions";

export const Route = createFileRoute("/farmer/assistant")({
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function AssistantPage() {
  const ask = useServerFn(askAssistant);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Habari! I'm your AgriTrust assistant. Ask me about your Trust Score, weather, or loans." },
  ]);
  const [input, setInput] = useState("");

  const send = useMutation({
    mutationFn: async (text: string) => {
      const next: Msg[] = [...messages, { role: "user", content: text }];
      setMessages(next);
      const res = await ask({ data: { messages: next, role: "farmer" } });
      setMessages([...next, { role: "assistant", content: res.reply }]);
    },
  });

  const submit = () => { if (input.trim()) { send.mutate(input.trim()); setInput(""); } };

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Copilot" title="AI Assistant" sub="Text · grounded on your live profile + trust score" />
      <div className="rounded-2xl glass">
        <div className="space-y-4 p-5 min-h-[420px]">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${m.role === "assistant" ? "bg-gradient-to-br from-emerald to-violet" : "bg-surface-elevated"}`}>
                {m.role === "assistant" ? <Sparkles className="h-4 w-4 text-primary-foreground" /> : <span className="text-xs font-bold">U</span>}
              </span>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-surface-elevated/60"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {send.isPending && <p className="text-xs text-muted-foreground">Thinking…</p>}
          {send.error && <p className="text-xs text-rose">{(send.error as Error).message}</p>}
        </div>
        <div className="border-t border-border/60 p-4">
          <div className="flex items-center gap-2 rounded-xl bg-surface-elevated/60 px-3 py-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Ask anything…" />
            <button onClick={submit} disabled={send.isPending} className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" /></button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Explain my score","Today's weather","How can I improve?","Loan readiness","Crop advice"].map(s => (
              <button key={s} onClick={() => send.mutate(s)} className="rounded-full bg-emerald/10 px-3 py-1 text-xs text-emerald hover:bg-emerald/20">{s}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
