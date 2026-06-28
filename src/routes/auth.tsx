import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Building2, Loader2, Lock, Mail, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";

const searchSchema = z.object({
  role: z.enum(["farmer", "lender"]).optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in · AgriTrust AI" }] }),
  component: Auth,
});

function Auth() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { user, isLender, loading, refresh } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (isLender) navigate({ to: "/lender" });
    else {
      // Promote any non-lender that lands here to a lender account
      supabase.from("profiles").upsert({ id: user.id, account_type: "lender", email: user.email, full_name: user.user_metadata?.full_name ?? user.email }).then(() => refresh().then(() => navigate({ to: "/lender" })));
    }
  }, [loading, user, isLender, navigate, refresh]);

  async function emailFlow(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { full_name: fullName, account_type: "lender" },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "Something went wrong"); }
    finally { setBusy(false); }
  }

  async function google() {
    setErr(null); setBusy(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
      if (r.error) throw r.error;
    } catch (e) { setErr(e instanceof Error ? e.message : "Google sign-in failed"); setBusy(false); }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader variant="public" />
      <main className="container-page py-10">
        <Link to="/" className="btn-ghost"><ArrowLeft className="h-4 w-4" /> Home</Link>
        <div className="mx-auto mt-6 grid max-w-5xl gap-8 md:grid-cols-2">
          <aside className="rounded-2xl bg-leaf p-8 text-white">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> <span className="text-sm font-semibold uppercase tracking-wider">Loan Officer Portal</span>
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold">Decide credit fairly. Every time.</h1>
            <p className="mt-3 text-white/85">Sign in to review farmer applications, see explainable Trust Scores, and act on graph + climate intelligence.</p>
            <ul className="mt-6 space-y-2 text-sm text-white/85">
              <li>✓ Explainable Trust Score on every farmer</li>
              <li>✓ Neo4j relationship graph</li>
              <li>✓ Climate risk overlay</li>
              <li>✓ Inclusive analytics for women, youth, PWD</li>
            </ul>
          </aside>

          <div className="card-soft p-8">
            <h2 className="font-display text-2xl font-bold">{mode === "signin" ? "Sign in" : "Create account"}</h2>
            <p className="mt-1 text-sm text-charcoal/70">For SACCOs, MFIs, banks, cooperatives & NGOs.</p>

            <button onClick={google} disabled={busy} className="btn-secondary mt-6 w-full">
              <GoogleMark /> Continue with Google
            </button>
            <div className="my-5 flex items-center gap-3 text-xs uppercase text-charcoal/50">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={emailFlow} className="space-y-3">
              {mode === "signup" && (
                <FieldLabel label="Full name" icon={User}>
                  <input className="field pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </FieldLabel>
              )}
              <FieldLabel label="Email" icon={Mail}>
                <input type="email" className="field pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </FieldLabel>
              <FieldLabel label="Password" icon={Lock}>
                <input type="password" className="field pl-10" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </FieldLabel>

              {err && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{err}</p>}

              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "signin" ? "Sign in" : "Create account"} <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <p className="mt-6 text-center text-sm">
              {mode === "signin" ? "Need an account?" : "Already have one?"}{" "}
              <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-leaf hover:underline">
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function FieldLabel({ label, icon: Icon, children }: { label: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-charcoal/80">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal/50" />
        {children}
      </div>
    </label>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.2 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.2 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.4 34.7 26.8 36 24 36c-5.3 0-9.7-3.5-11.3-8.3l-6.5 5C9.6 39.5 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.5 5.5C41.9 35.7 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
