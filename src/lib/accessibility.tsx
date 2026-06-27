import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type A11ySettings = {
  largeText: boolean;
  highContrast: boolean;
  dyslexiaFont: boolean;
  reduceMotion: boolean;
};

type A11yContextValue = A11ySettings & {
  toggle: (key: keyof A11ySettings) => void;
  reset: () => void;
};

const defaults: A11ySettings = {
  largeText: false,
  highContrast: false,
  dyslexiaFont: false,
  reduceMotion: false,
};

const STORAGE_KEY = "agritrust-a11y";

const A11yContext = createContext<A11yContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(defaults);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...defaults, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("a11y-large-text", settings.largeText);
    root.classList.toggle("a11y-high-contrast", settings.highContrast);
    root.classList.toggle("a11y-dyslexia", settings.dyslexiaFont);
    root.classList.toggle("a11y-reduce-motion", settings.reduceMotion);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const toggle = (key: keyof A11ySettings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  const reset = () => setSettings(defaults);

  return (
    <A11yContext.Provider value={{ ...settings, toggle, reset }}>
      {children}
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error("useA11y must be used inside AccessibilityProvider");
  return ctx;
}
