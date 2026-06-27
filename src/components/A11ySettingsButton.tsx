import { useState } from "react";
import { Accessibility, X } from "lucide-react";
import { useA11y } from "@/lib/accessibility";

export function A11ySettingsButton() {
  const [open, setOpen] = useState(false);
  const a11y = useA11y();

  const items: Array<{ key: Parameters<typeof a11y.toggle>[0]; label: string; desc: string }> = [
    { key: "largeText", label: "Large text", desc: "Bump base font size by 12.5%" },
    { key: "highContrast", label: "High contrast", desc: "Stronger text/background separation" },
    { key: "dyslexiaFont", label: "Dyslexia-friendly font", desc: "Use Atkinson Hyperlegible" },
    { key: "reduceMotion", label: "Reduce motion", desc: "Pause animations and transitions" },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Accessibility settings"
        className="fixed bottom-6 left-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Accessibility className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Accessibility settings"
          className="fixed inset-0 z-50 grid place-items-end bg-black/40 backdrop-blur-sm sm:place-items-center"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl glass-strong p-6 shadow-elevated">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Accessibility</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Make AgriTrust easier to use. Your settings stay on this device.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close accessibility settings"
                className="rounded-lg p-2 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="mt-5 space-y-3">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between rounded-xl bg-surface-elevated/60 p-4"
                >
                  <div className="pr-4">
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={a11y[item.key]}
                    onClick={() => a11y.toggle(item.key)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      a11y[item.key] ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                        a11y[item.key] ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={a11y.reset}
              className="mt-5 w-full rounded-xl bg-surface-elevated py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </>
  );
}
