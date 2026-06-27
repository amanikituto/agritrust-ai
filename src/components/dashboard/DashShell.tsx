import { useState, type ComponentType, type ReactNode } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronDown,
  Globe,
  Leaf,
  LogOut,
  Menu,
  Mic,
  Moon,
  Search,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export function DashShell({
  portal,
  nav,
  children,
}: {
  portal: "Farmer" | "Lender";
  nav: NavItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false); // mobile drawer
  const [assistant, setAssistant] = useState(false);
  const [dark, setDark] = useState(true);
  const [lang, setLang] = useState<"EN" | "SW">("EN");
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const name =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? portal;

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("light", !next);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border/60 bg-surface/95 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald to-forest shadow-glow">
              <Leaf className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </span>
            <span className="text-sm font-bold tracking-tight">AgriTrust AI</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-elevated lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5">
          <span className="inline-flex items-center rounded-full bg-emerald/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald">
            {portal} Portal
          </span>
        </div>
        <nav className="mt-4 flex flex-col gap-0.5 overflow-y-auto px-3 pb-6" style={{ maxHeight: "calc(100dvh - 7rem)" }}>
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== `/${portal.toLowerCase()}` && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-emerald/10 text-emerald"
                    : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6">
          <button
            onClick={() => setOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-md hover:bg-surface-elevated lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder={portal === "Farmer" ? "Search records, advice…" : "Search farmers, applications…"}
              className="h-9 w-full rounded-lg border border-border bg-surface-elevated/60 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald"
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === "EN" ? "SW" : "EN")}
              className="hidden items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-surface-elevated hover:text-foreground sm:inline-flex"
              aria-label="Language"
            >
              <Globe className="h-3.5 w-3.5" /> {lang}
            </button>
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setAssistant(true)}
              className="hidden items-center gap-1.5 rounded-md bg-emerald/10 px-3 py-2 text-xs font-semibold text-emerald hover:bg-emerald/20 sm:inline-flex"
            >
              <Sparkles className="h-3.5 w-3.5" /> AI Assistant
            </button>
            <button
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
              aria-label="Voice assistant"
            >
              <Mic className="h-4 w-4" />
            </button>
            <Link
              to={portal === "Farmer" ? "/farmer/notifications" : "/lender/notifications"}
              className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose" />
            </Link>
            <div className="ml-1 flex items-center gap-2 rounded-lg bg-surface-elevated/60 px-2 py-1.5 text-xs">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-emerald to-sky text-[10px] font-bold text-primary-foreground">
                {name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[120px] truncate font-medium md:inline">{name}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
            <button
              onClick={async () => {
                await signOut();
                router.navigate({ to: "/" });
              }}
              className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
      </div>

      {/* Assistant drawer */}
      {assistant && <AssistantDrawer portal={portal} onClose={() => setAssistant(false)} />}
    </div>
  );
}

function AssistantDrawer({ portal, onClose }: { portal: string; onClose: () => void }) {
  const suggestions =
    portal === "Farmer"
      ? ["Explain my Trust Score", "How can I improve?", "Today's weather", "Loan readiness"]
      : ["Summarize the queue", "Why approve Amina W.?", "High-risk counties", "Bias check status"];
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-md flex-col border-l border-border/60 bg-surface/95 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald to-violet">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            <div>
              <div className="text-sm font-semibold">AgriTrust AI Assistant</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {portal} copilot · EN/SW
              </div>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-surface-elevated">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          <div className="rounded-xl bg-surface-elevated/60 p-3 text-sm">
            Hi! Ask me to explain a Trust Score, summarize an application, or recommend next steps.
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                className="rounded-full bg-emerald/10 px-3 py-1.5 text-xs font-medium text-emerald hover:bg-emerald/20"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-border/60 p-4">
          <div className="flex items-center gap-2 rounded-lg bg-surface-elevated/60 px-3 py-2">
            <Mic className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Ask anything — text or voice"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
