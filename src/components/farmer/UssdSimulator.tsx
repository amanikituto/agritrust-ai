import { useState } from "react";
import { Phone, Send, RotateCcw } from "lucide-react";
import { Card, Tag } from "@/components/dashboard/primitives";

export function UssdSimulator({ defaultPhone = "+254700000000" }: { defaultPhone?: string }) {
  const [phone, setPhone] = useState(defaultPhone);
  const [steps, setSteps] = useState<string[]>([]);
  const [screen, setScreen] = useState("Dial *483*900# to start");
  const [busy, setBusy] = useState(false);
  const sessionId = `sim-${phone}`;

  async function send(nextSteps: string[]) {
    setBusy(true);
    try {
      const body = new URLSearchParams({
        sessionId,
        serviceCode: "*483*900#",
        phoneNumber: phone,
        text: nextSteps.join("*"),
      });
      const r = await fetch("/api/public/ussd", { method: "POST", body });
      const t = await r.text();
      setScreen(t);
      setSteps(nextSteps);
    } catch {
      setScreen("END Network error.");
    } finally {
      setBusy(false);
    }
  }

  const isEnd = screen.startsWith("END");
  const isCon = screen.startsWith("CON");
  const body = screen.startsWith("CON ") || screen.startsWith("END ") ? screen.slice(4) : screen;

  return (
    <div className="space-y-4">
      <Card>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Caller phone (must exist in profiles)
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-10 max-w-xs rounded-md border border-border bg-surface-elevated/60 px-3 text-sm"
          />
        </label>
      </Card>

      <Card title="USSD screen" icon={Phone}>
        <div className="mb-3 flex items-center gap-2">
          <Tag
            label={isEnd ? "Session ended" : isCon ? "Awaiting input" : "Idle"}
            tone={isEnd ? "rose" : isCon ? "emerald" : "gold"}
          />
          <Tag label={`*483*900# · ${steps.length === 0 ? "menu" : steps.join("*")}`} tone="sky" />
        </div>
        <pre className="whitespace-pre-wrap rounded-lg border border-border/60 bg-black/90 p-4 font-mono text-sm text-emerald">
{body}
        </pre>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => send([])}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Dial menu
          </button>
          {!isEnd && (
            <>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((k) => (
                <button
                  key={k}
                  onClick={() => send([...steps, k])}
                  disabled={busy}
                  className="h-10 w-10 rounded-md border border-border bg-surface-elevated/60 font-mono text-sm hover:bg-emerald/10"
                >
                  {k}
                </button>
              ))}
              <SendInput onSend={(t) => send([...steps, t])} />
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function SendInput({ onSend }: { onSend: (t: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="text input"
        className="h-10 w-44 rounded-md border border-border bg-surface-elevated/60 px-3 text-sm"
      />
      <button
        onClick={() => {
          if (val) {
            onSend(val);
            setVal("");
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
      >
        <Send className="h-3.5 w-3.5" /> Send
      </button>
    </div>
  );
}
