import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Leaf,
  Loader2,
  Lock,
  Mail,
  Sprout,
  User,
} from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";

type AccountType = "farmer" | "lender";
type Mode = "signin" | "signup";

const searchSchema = z.object({
  role: z.enum(["farmer", "lender"]).optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in · AgriTrust AI" },
      {
        name: "description",
        content: "Sign in or create your AgriTrust AI account as a farmer or financial institution.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const { user, isFarmer, isLender, loading } = useAuth();

  const [accountType, setAccountType] = useState<AccountType>(search.role ?? "farmer");
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in, route to the right dashboard
  useEffect(() => {
    if (loading || !user) return;
    if (isLender) navigate({ to: "/lender" });
    else if (isFarmer) navigate({ to: "/farmer" });
    else navigate({ to: "/farmer" }); // fallback while roles load
  }, [loading, user, isFarmer, isLender, navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, account_type: accountType },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      // Remember intent so the redirect goes to the right dashboard
      sessionStorage.setItem("agritrust:intent", accountType);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth",
      });
      if (result.error) throw result.error;
      // result.redirected handles the full-page flow
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
      setBusy(false);
    }
  }

  const isFarmerType = accountType === "farmer";

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="grid min-h-dvh lg:grid-cols-2">
        {/* Left brand panel */}
        <aside
          className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="absolute inset-0 grid-bg opacity-60" />
          <Link to="/" className="relative flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-emerald to-forest shadow-glow">
              <Leaf className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold tracking-tight">AgriTrust AI</span>
          </Link>

          <div className="relative max-w-md">
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Fair finance.{" "}
              <span className="text-gradient-trust">Explainable decisions.</span>{" "}
              Inclusive agriculture.
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Join lenders and farmers building trust-driven agricultural finance — powered by
              Explainable Graph AI and climate intelligence.
            </p>

            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Build your Digital Trust Profile",
                "AI explanations behind every score",
                "Gender-inclusive lending analytics",
                "Climate & graph intelligence",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative text-xs text-muted-foreground">
            © {new Date().getFullYear()} AgriTrust AI · Making invisible farmers visible.
          </div>
        </aside>

        {/* Right form */}
        <main className="flex flex-col px-6 py-10 sm:px-10 lg:px-16">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back home
            </Link>
            <div className="text-xs text-muted-foreground">
              {mode === "signin" ? "Need an account?" : "Already have one?"}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="font-semibold text-emerald hover:underline"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </div>
          </div>

          <div className="mx-auto mt-12 w-full max-w-md">
            <h2 className="text-3xl font-bold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to your AgriTrust AI workspace."
                : "Choose your portal — you can update profile details later."}
            </p>

            {/* Role tabs */}
            <div className="mt-8 grid grid-cols-2 gap-2 rounded-2xl bg-surface-elevated/60 p-1.5">
              <RoleTab
                active={isFarmerType}
                onClick={() => setAccountType("farmer")}
                icon={Sprout}
                label="I'm a Farmer"
              />
              <RoleTab
                active={!isFarmerType}
                onClick={() => setAccountType("lender")}
                icon={Building2}
                label="I'm a Lender"
              />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold transition hover:bg-surface-elevated disabled:opacity-60"
            >
              <GoogleMark />
              Continue with Google
            </button>

            <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleEmail} className="space-y-3">
              {mode === "signup" && (
                <Field
                  id="name"
                  label="Full name"
                  icon={User}
                  type="text"
                  value={fullName}
                  onChange={setFullName}
                  required
                />
              )}
              <Field
                id="email"
                label="Email"
                icon={Mail}
                type="email"
                value={email}
                onChange={setEmail}
                required
              />
              <Field
                id="password"
                label="Password"
                icon={Lock}
                type="password"
                value={password}
                onChange={setPassword}
                required
                minLength={6}
              />

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Sign in" : "Create account"} <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              By continuing you agree to our terms and acknowledge our privacy policy.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function RoleTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-glow"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  type,
  value,
  onChange,
  required,
  minLength,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div className="relative mt-1">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          type={type}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-10 py-3 text-sm outline-none transition focus-visible:border-emerald focus-visible:ring-2 focus-visible:ring-emerald/40"
        />
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.2 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.2 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.4 34.7 26.8 36 24 36c-5.3 0-9.7-3.5-11.3-8.3l-6.5 5C9.6 39.5 16.3 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.5 5.5C41.9 35.7 44 30.2 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
