import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, RotateCcw, Send } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/ussd")({
  head: () => ({ meta: [{ title: "USSD Simulator · *483*900#" }] }),
  component: UssdPage,
});

function UssdPage() {
  const [phone, setPhone] = useState("+254700111001");
  const [steps, setSteps] = useState<string[]>([]);
  const [screen, setScreen] = useState("Press 'Dial' to start *483*900#");
  const [busy, setBusy] = useState(false);
  const sessionId = `sim-${phone}`;

  async function send(next: string[]) {
    setBusy(true);
    try {
      const body = new URLSearchParams({
        sessionId, serviceCode: "*483*900#", phoneNumber: phone, text: next.join("*"),
      });
      const r = await fetch("/api/public/ussd", { method: "POST", body });
      setScreen(await r.text());
      setSteps(next);
    } catch { setScreen("END Network error."); }
    finally { setBusy(false); }
  }

  const ended = screen.startsWith("END");
  const body = screen.startsWith("CON ") || screen.startsWith("END ") ? screen.slice(4) : screen;

  return (
    <div className="min-h-dvh">
      <SiteHeader variant="public" />
      <main className="container-page py-10">
        <h1 className="font-display text-3xl font-bold text-leaf">USSD Simulator · *483*900#</h1>
        <p className="mt-1 text-sm text-charcoal/70">Test the offline lending flow that runs on any feature phone.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="card-soft p-6">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-charcoal/80">Caller phone (must exist in profiles)</span>
              <input className="field max-w-xs" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <p className="mt-2 text-xs text-charcoal/60">Try demo farmer: +254700111001 (Mary)</p>
          </div>

          <div className="card-soft bg-charcoal p-4 text-white">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Phone className="h-4 w-4" /> *483*900# · {steps.length ? steps.join("*") : "menu"}
            </div>
            <pre className="mt-3 min-h-[230px] whitespace-pre-wrap rounded-lg bg-black/40 p-4 font-mono text-sm text-leaf-soft">{body}</pre>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button onClick={() => send([])} disabled={busy} className="rounded-md border border-white/20 px-3 py-2 text-xs hover:bg-white/10">
                <RotateCcw className="mr-1 inline h-3 w-3" /> Dial menu
              </button>
              {!ended && (
                <>
                  {["1","2","3","4","5","6","7","8","9","*","0","#"].map((k) => (
                    <button key={k} onClick={() => send([...steps, k])} disabled={busy}
                      className="h-10 w-10 rounded-md border border-white/20 font-mono hover:bg-white/10">{k}</button>
                  ))}
                  <SendInput onSend={(t) => send([...steps, t])} />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="card-soft mt-6 p-6">
          <h2 className="font-display font-bold">Menu map</h2>
          <ul className="mt-2 grid gap-1 text-sm text-charcoal/80 sm:grid-cols-2">
            <li>1. Apply for Loan</li><li>2. Check Trust Score</li>
            <li>3. Loan Status</li><li>4. Update Farm Records</li>
            <li>5. Climate Alerts</li><li>6. Exit</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function SendInput({ onSend }: { onSend: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="text input"
        className="h-10 w-36 rounded-md border border-white/20 bg-black/40 px-2 text-xs text-white" />
      <button onClick={() => { if (v) { onSend(v); setV(""); } }}
        className="rounded-md bg-sun px-3 py-2 text-xs font-semibold text-charcoal">
        <Send className="mr-1 inline h-3 w-3" /> Send
      </button>
    </div>
  );
}
