import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  CloudRain,
  Github,
  Globe2,
  Leaf,
  LineChart,
  Network,
  PlayCircle,
  Shield,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
  Users,
} from "lucide-react";
import { GraphHero } from "@/components/GraphHero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriTrust AI — Making Invisible Farmers Visible" },
      {
        name: "description",
        content:
          "Explainable Graph AI for agricultural credit. Trust scores from alternative data, climate analytics, and farmer relationships.",
      },
      { property: "og:title", content: "AgriTrust AI — Making Invisible Farmers Visible" },
      {
        property: "og:description",
        content:
          "AI-powered lending intelligence using alternative data, Graph AI, and climate analytics.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Nav />
      <Hero />
      <LogoStrip />
      <Problem />
      <Solution />
      <Features />
      <TrustScorePreview />
      <Partners />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}

/* ---------- NAV ---------- */
function Nav() {
  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto mt-4 flex max-w-7xl items-center justify-between rounded-2xl glass px-5 py-3 mx-4 lg:mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-base font-bold tracking-tight">AgriTrust AI</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#platform" className="hover:text-foreground transition-colors">Platform</a>
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#trust" className="hover:text-foreground transition-colors">Trust Score</a>
          <a href="#partners" className="hover:text-foreground transition-colors">Partners</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ role: "farmer", mode: "signup" }}
            className="hidden items-center gap-1.5 rounded-lg glass-strong px-3.5 py-2 text-sm font-semibold transition hover:bg-surface-elevated md:inline-flex"
          >
            <Sprout className="h-3.5 w-3.5 text-emerald" /> Farmer
          </Link>
          <Link
            to="/auth"
            search={{ role: "lender", mode: "signup" }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110"
          >
            <Building2 className="h-3.5 w-3.5" /> Lender Portal
          </Link>
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-emerald to-forest shadow-glow">
      <Leaf className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
    </div>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  return (
    <section
      className="relative isolate overflow-hidden pt-40 pb-28"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 opacity-60">
        <GraphHero />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Explainable Graph AI for agricultural finance
          </div>

          <h1 className="mt-7 text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Making{" "}
            <span className="text-gradient-trust">Invisible Farmers</span>
            <br />
            Visible.
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            AI-powered lending intelligence built on alternative data, Graph AI, and climate
            analytics — so banks, SACCOs and cooperatives can lend to smallholder farmers with
            confidence.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              search={{ role: "farmer", mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110"
            >
              <Sprout className="h-4 w-4" /> I'm a Farmer
            </Link>
            <Link
              to="/auth"
              search={{ role: "lender", mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-xl glass-strong px-6 py-3.5 text-sm font-semibold text-foreground transition hover:bg-surface-elevated"
            >
              <Building2 className="h-4 w-4" /> I'm a Financial Institution
            </Link>
            <button className="inline-flex items-center gap-2 rounded-xl px-4 py-3.5 text-sm font-medium text-muted-foreground transition hover:text-foreground">
              <PlayCircle className="h-5 w-5" /> Watch demo
            </button>
          </div>

          <p className="mt-10 text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
            Fair finance · Explainable decisions · Inclusive agriculture
          </p>
        </div>

        {/* Floating stat cards */}
        <div className="relative mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { k: "2.4M+", v: "Farmers profiled", icon: Users },
            { k: "87", v: "Avg Trust Score", icon: ShieldCheck },
            { k: "12K+", v: "Loans assessed", icon: TrendingUp },
            { k: "94%", v: "Repayment rate", icon: Activity },
          ].map((s) => (
            <div key={s.v} className="rounded-2xl glass p-5 text-left">
              <s.icon className="h-5 w-5 text-emerald" />
              <div className="mt-3 text-3xl font-bold tracking-tight">{s.k}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- LOGO STRIP ---------- */
function LogoStrip() {
  const partners = ["Neo4j", "Masumi", "Lovable", "AFRACA", "Kenya AI Challenge", "Featherless"];
  return (
    <section className="border-y border-border/60 bg-surface/40 py-10">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Backed and powered by
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {partners.map((p) => (
            <span
              key={p}
              className="text-lg font-semibold tracking-tight text-muted-foreground/80 transition hover:text-foreground"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- PROBLEM ---------- */
function Problem() {
  const stats = [
    { k: "500M", v: "Smallholder farmers excluded from formal credit globally" },
    { k: "<10%", v: "Of African farmers have access to bank loans" },
    { k: "70%", v: "Lack collateral required by traditional lenders" },
  ];
  return (
    <section id="platform" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald">
            The Problem
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            The world's most productive farmers are{" "}
            <span className="text-gradient-trust">credit invisible.</span>
          </h2>
          <p className="mt-5 text-muted-foreground">
            Traditional lending depends on collateral, formal histories and paperwork that
            smallholders simply don't have — even when they're trustworthy, productive, and
            connected.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.k} className="rounded-2xl glass p-8">
              <div className="text-5xl font-bold tracking-tight text-gradient-primary">
                {s.k}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- SOLUTION ---------- */
function Solution() {
  const steps = [
    {
      n: "01",
      title: "Alternative data",
      body: "Mobile money, cooperative records, satellite NDVI, weather, agronomy, and community signals.",
      icon: Globe2,
    },
    {
      n: "02",
      title: "Graph AI",
      body: "Neo4j-powered relationship intelligence reveals trust networks, fraud rings and influence.",
      icon: Network,
    },
    {
      n: "03",
      title: "Explainable AI",
      body: "Every score comes with SHAP-based reasoning, fairness checks, and human-readable summaries.",
      icon: Brain,
    },
    {
      n: "04",
      title: "Trust Score",
      body: "A 0–100 Digital Trust Profile combining behavior, finance, climate, and community signals.",
      icon: ShieldCheck,
    },
    {
      n: "05",
      title: "Lending decision",
      body: "Approve, conditionally approve or refer — with a full audit trail and improvement roadmap.",
      icon: TrendingUp,
    },
  ];

  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald">
            The Solution
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            From scattered signals to a{" "}
            <span className="text-gradient-trust">single trustworthy score.</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-4 lg:grid-cols-5">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="group relative rounded-2xl glass p-6 transition hover:-translate-y-1 hover:bg-surface-elevated"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground/70">{s.n}</span>
                <s.icon className="h-5 w-5 text-emerald transition group-hover:scale-110" />
              </div>
              <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-emerald/60 lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- FEATURES ---------- */
function Features() {
  const cards = [
    {
      icon: Network,
      title: "Graph Intelligence",
      body: "Neo4j-powered explorer to visualize farmer relationships, cooperatives, lenders and supply chains.",
      tint: "from-emerald/20 to-transparent",
    },
    {
      icon: CloudRain,
      title: "Climate Intelligence",
      body: "Open-Meteo and satellite NDVI feed drought, flood, and seasonal forecast scoring.",
      tint: "from-sky/20 to-transparent",
    },
    {
      icon: Brain,
      title: "Explainable AI",
      body: "SHAP waterfalls, fairness indicators and plain-language reasoning behind every decision.",
      tint: "from-violet/20 to-transparent",
    },
    {
      icon: ShieldCheck,
      title: "Digital Trust Profiles",
      body: "A complete behavioral, financial and agricultural identity for every smallholder farmer.",
      tint: "from-gold/20 to-transparent",
    },
    {
      icon: LineChart,
      title: "Credit Readiness",
      body: "Personalized roadmaps that show farmers exactly how to improve their score and qualify.",
      tint: "from-emerald-glow/20 to-transparent",
    },
    {
      icon: BarChart3,
      title: "Portfolio Analytics",
      body: "Institution-wide dashboards for risk, gender inclusion, climate exposure and performance.",
      tint: "from-orange/20 to-transparent",
    },
  ];

  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald">
              Platform
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              The operating system for agricultural finance.
            </h2>
          </div>
          <p className="max-w-md text-muted-foreground">
            Six tightly-integrated modules — built for loan officers, credit managers, cooperatives,
            and regulators.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.title}
              className="group relative overflow-hidden rounded-2xl glass p-7 transition hover:-translate-y-1"
            >
              <div
                className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${c.tint} blur-2xl`}
              />
              <c.icon className="h-6 w-6 text-emerald" />
              <h3 className="mt-6 text-lg font-semibold tracking-tight">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              <div className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-emerald opacity-0 transition group-hover:opacity-100">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- TRUST SCORE PREVIEW ---------- */
function TrustScorePreview() {
  const signals = [
    { label: "Repayment history", value: 92, color: "var(--emerald)" },
    { label: "Cooperative engagement", value: 86, color: "var(--sky)" },
    { label: "Mobile money activity", value: 78, color: "var(--gold)" },
    { label: "Climate exposure (low)", value: 81, color: "var(--violet)" },
    { label: "Verified production", value: 88, color: "var(--emerald-glow)" },
  ];
  const score = 82;
  const circ = 2 * Math.PI * 70;

  return (
    <section id="trust" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald">
              Explainable trust score
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Every score comes with{" "}
              <span className="text-gradient-trust">a reason.</span>
            </h2>
            <p className="mt-5 max-w-lg text-muted-foreground">
              No black boxes. AgriTrust AI shows exactly which signals raised or lowered a farmer's
              score — and what they can do next to improve it.
            </p>

            <div className="mt-8 space-y-4">
              {signals.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-mono text-foreground">{s.value}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.value}%`,
                        background: `linear-gradient(90deg, ${s.color}, color-mix(in oklab, ${s.color} 60%, white))`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl glass-strong p-5 text-sm leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">AI summary:</span> Farmer received a
              Trust Score of <span className="text-emerald font-semibold">82</span> because of
              excellent repayment history, strong cooperative engagement, consistent mobile money
              usage, and low drought exposure.
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-emerald/20 via-sky/10 to-violet/20 blur-3xl" />
            <div className="rounded-3xl glass-strong p-10 shadow-elevated">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Farmer Trust Profile</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
                  Live
                </span>
              </div>

              <div className="mt-6 grid place-items-center">
                <div className="relative">
                  <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
                    <defs>
                      <linearGradient id="ringGrad" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.18 155)" />
                        <stop offset="50%" stopColor="oklch(0.78 0.13 230)" />
                        <stop offset="100%" stopColor="oklch(0.72 0.15 295)" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="none"
                      stroke="oklch(1 0 0 / 0.06)"
                      strokeWidth="14"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="none"
                      stroke="url(#ringGrad)"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={circ}
                      strokeDashoffset={circ * (1 - score / 100)}
                    />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <div className="text-5xl font-bold tracking-tight">{score}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        Trust Score
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                {[
                  { l: "Risk", v: "Low", c: "text-emerald" },
                  { l: "Confidence", v: "94%", c: "text-sky" },
                  { l: "Climate", v: "Stable", c: "text-gold" },
                ].map((t) => (
                  <div key={t.l} className="rounded-xl bg-surface-elevated/60 p-3">
                    <div className={`text-sm font-semibold ${t.c}`}>{t.v}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t.l}
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110">
                View full profile <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- PARTNERS ---------- */
function Partners() {
  return (
    <section id="partners" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl glass-strong p-10 md:p-16">
          <div className="grid gap-10 lg:grid-cols-3 lg:items-center">
            <div className="lg:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald">
                Ecosystem
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Built with the leaders in graph data, AI, and African finance.
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Neo4j Aura graph database, Masumi data, Featherless AI inference, and partnerships
                with AFRACA, the Kenya AI Challenge, and pan-African cooperative networks.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {["Neo4j", "Masumi", "AFRACA", "Featherless", "Open-Meteo", "Mapbox"].map((p) => (
                <div
                  key={p}
                  className="rounded-xl bg-surface-elevated/60 px-4 py-3 text-center font-semibold tracking-tight"
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- TESTIMONIALS ---------- */
function Testimonials() {
  const items = [
    {
      q: "AgriTrust AI lets us approve loans for farmers we'd never see with traditional credit scoring. The explainability gives our risk committee real confidence.",
      a: "Head of Agri Credit",
      r: "Tier-1 African Bank",
    },
    {
      q: "The Graph view exposed two circular-lending rings in our portfolio within 48 hours. It pays for itself.",
      a: "Credit Risk Director",
      r: "Regional SACCO",
    },
    {
      q: "Our cooperative members finally see what they need to do to qualify — and they're acting on it.",
      a: "Cooperative Administrator",
      r: "Nyeri County, Kenya",
    },
  ];
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald">
            Trusted by lenders
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Real outcomes, in the field.
          </h2>
        </div>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {items.map((t) => (
            <figure key={t.a} className="rounded-2xl glass p-7">
              <Shield className="h-5 w-5 text-emerald" />
              <blockquote className="mt-5 text-sm leading-relaxed text-foreground/90">
                "{t.q}"
              </blockquote>
              <figcaption className="mt-6 border-t border-border/60 pt-4 text-xs">
                <div className="font-semibold text-foreground">{t.a}</div>
                <div className="text-muted-foreground">{t.r}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- CTA ---------- */
function CTA() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-5xl px-6">
        <div
          className="relative overflow-hidden rounded-3xl border border-border/60 p-12 text-center md:p-20"
          style={{
            background:
              "radial-gradient(ellipse at top, oklch(0.72 0.18 155 / 0.3), transparent 60%), oklch(0.18 0.025 220)",
          }}
        >
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="relative">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Build trust-driven finance for{" "}
              <span className="text-gradient-trust">Africa's farmers.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              One relationship at a time. Book a demo with our team to see AgriTrust AI on your own
              portfolio data.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110">
                Request Demo <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl glass-strong px-6 py-3.5 text-sm font-semibold text-foreground transition hover:bg-surface-elevated">
                Explore Platform
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- FOOTER ---------- */
function Footer() {
  return (
    <footer className="border-t border-border/60 py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <Logo />
              <span className="text-base font-bold tracking-tight">AgriTrust AI</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Making invisible farmers visible. Building trust-driven finance for Africa's farmers,
              one relationship at a time.
            </p>
          </div>
          {[
            { h: "Platform", items: ["Graph AI", "Climate", "Trust Score", "Portfolio"] },
            { h: "Resources", items: ["Documentation", "API", "Changelog", "Pricing"] },
            { h: "Company", items: ["About", "Privacy", "Terms", "Contact"] },
          ].map((col) => (
            <div key={col.h}>
              <h4 className="text-sm font-semibold tracking-tight">{col.h}</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {col.items.map((i) => (
                  <li key={i}>
                    <a className="transition hover:text-foreground" href="#">
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} AgriTrust AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <Github className="h-4 w-4" /> GitHub
            </a>
            <a href="#" className="hover:text-foreground">Status</a>
            <a href="#" className="hover:text-foreground">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
