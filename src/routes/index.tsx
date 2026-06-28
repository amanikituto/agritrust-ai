import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Sprout, Building2, Phone, ShieldCheck, Network,
  Cloud, TrendingUp, Users, FileCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriTrust AI — Making Invisible Farmers Visible" },
      { name: "description", content: "Help Kenyan lenders assess smallholder farmers fairly using alternative data, graph relationships and climate risk." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-dvh">
      <SiteHeader variant="public" />

      <section className="relative overflow-hidden bg-leaf text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, #A8D5BA 0%, transparent 40%), radial-gradient(circle at 80% 80%, #F4B942 0%, transparent 35%)" }} />
        <div className="container-page relative grid gap-12 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <span className="chip bg-white/15 text-white">For Kenyan SACCOs, MFIs, banks & cooperatives</span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight md:text-5xl">
              AgriTrust AI<br/>
              <span className="text-sun">Making Invisible Farmers Visible</span>
            </h1>
            <p className="mt-5 max-w-xl text-white/85">
              A simple AI-powered credit assessment tool helping Kenyan lenders evaluate
              smallholder farmers using trust signals, cooperative data, climate risk
              and repayment behaviour.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/farmer-intake" className="btn-primary bg-sun text-charcoal hover:brightness-110">
                <Sprout className="h-4 w-4" /> Register a Farmer
              </Link>
              <Link to="/auth" className="btn-secondary bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Building2 className="h-4 w-4" /> Loan Officer Sign In
              </Link>
              <Link to="/lender" className="btn-ghost text-white hover:bg-white/10">
                View Demo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="card-soft mx-auto w-full max-w-md bg-white p-6 text-charcoal">
            <div className="text-xs uppercase tracking-wider text-charcoal/60">Sample Trust Profile</div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="font-display text-lg font-bold">Mary Wanjiku</div>
                <div className="text-sm text-charcoal/70">Nakuru · Maize, beans</div>
              </div>
              <div className="text-right">
                <div className="font-display text-3xl font-bold text-leaf">78</div>
                <div className="text-xs text-charcoal/60">Trust Score</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <Pill tone="success">Low Risk</Pill>
              <Pill tone="leaf">Coop member</Pill>
              <Pill tone="sun">M-Pesa active</Pill>
              <Pill tone="leaf">Insurance</Pill>
            </div>
            <p className="mt-4 rounded-lg bg-cream p-3 text-sm leading-relaxed">
              Strong repayment record and cooperative ties suggest Mary is creditworthy for up to
              <strong className="text-leaf"> KES 120,000</strong> despite limited collateral.
            </p>
          </div>
        </div>
      </section>

      <Section title="The Problem" eyebrow="Why this matters">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: "No collateral", body: "Smallholder farmers rarely have land titles or formal assets banks accept." },
            { title: "No credit file", body: "Most are invisible to CRBs even when they sell, save and repay reliably." },
            { title: "Unfair scoring", body: "Generic models penalise gender, age and disability — and miss the real signals." },
          ].map((c) => (
            <div key={c.title} className="card-soft p-6">
              <div className="font-display text-lg font-bold text-leaf">{c.title}</div>
              <p className="mt-2 text-sm text-charcoal/70">{c.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="How AgriTrust Works" eyebrow="In four steps" tone="muted">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { icon: Sprout, t: "Register", b: "Capture farmer intake and inclusion data." },
            { icon: Network, t: "Graph", b: "Build cooperative, buyer and supplier relationships in Neo4j." },
            { icon: ShieldCheck, t: "Score", b: "Generate a transparent 100-point Trust Score." },
            { icon: FileCheck, t: "Decide", b: "Loan officer reviews, decides, and updates the audit trail." },
          ].map((s) => (
            <div key={s.t} className="card-soft p-6">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-leaf text-white"><s.icon className="h-5 w-5" /></div>
              <div className="mt-3 font-display text-lg font-bold text-leaf">{s.t}</div>
              <p className="mt-1 text-sm text-charcoal/70">{s.b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Who It Helps" eyebrow="Built for">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Users, t: "Rural loan officers", b: "Decide quickly with explainable scores and risk context." },
            { icon: Sprout, t: "Smallholder farmers", b: "Be seen for what you actually do — savings, harvests, repayments." },
            { icon: Building2, t: "Cooperatives & SACCOs", b: "Strengthen member trust with shared data." },
          ].map((c) => (
            <div key={c.t} className="card-soft p-6">
              <c.icon className="h-6 w-6 text-leaf" />
              <div className="mt-3 font-display text-lg font-bold">{c.t}</div>
              <p className="mt-1 text-sm text-charcoal/70">{c.b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Key Features" eyebrow="What you get" tone="muted">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: ShieldCheck, t: "Explainable Trust Score", b: "Plain-language reasons behind every decision." },
            { icon: Network, t: "Neo4j Relationship Graph", b: "See cooperative, buyer and savings ties." },
            { icon: Cloud, t: "Climate Risk Layer", b: "Drought, flood, and rainfall reliability signals." },
            { icon: TrendingUp, t: "Inclusion Analytics", b: "Track women, youth and PWD coverage fairly." },
            { icon: Phone, t: "USSD Access", b: "Works on any feature phone over *483*900#." },
            { icon: FileCheck, t: "Decision Workspace", b: "Approve, request info, or reject with audit trail." },
          ].map((f) => (
            <div key={f.t} className="card-soft p-6">
              <f.icon className="h-5 w-5 text-leaf" />
              <div className="mt-3 font-display font-bold">{f.t}</div>
              <p className="mt-1 text-sm text-charcoal/70">{f.b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Demo Farmers" eyebrow="Seed data">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "Mary Wanjiku", c: "Nakuru", note: "Maize · Coop · Strong repayment" },
            { n: "Brian Otieno", c: "Kisumu", note: "Youth · Horticulture · M-Pesa active" },
            { n: "Aisha Mohamed", c: "Garissa", note: "Dairy · Climate-exposed · Savings group" },
            { n: "Peter Mwangi", c: "Murang'a", note: "Mixed · Coffee buyer ties" },
            { n: "Grace Naliaka", c: "Bungoma", note: "Living with disability · Extension visits" },
            { n: "Joseph Kiptoo", c: "Uasin Gishu", note: "Maize & dairy · Drought exposure" },
          ].map((f) => (
            <div key={f.n} className="card-soft p-5">
              <div className="font-display font-bold">{f.n}</div>
              <div className="text-sm text-charcoal/60">{f.c}</div>
              <p className="mt-2 text-sm">{f.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/lender" className="btn-primary">Open Loan Officer Dashboard <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </Section>

      <footer className="border-t border-border bg-white">
        <div className="container-page py-8 text-center text-sm text-charcoal/60">
          © {new Date().getFullYear()} AgriTrust AI · Built for the AFRACA Kenya AI Challenge.
        </div>
      </footer>
    </div>
  );
}

function Section({ title, eyebrow, children, tone }: { title: string; eyebrow?: string; tone?: "muted"; children: React.ReactNode }) {
  return (
    <section className={`py-16 md:py-20 ${tone === "muted" ? "bg-muted/50" : ""}`}>
      <div className="container-page">
        <div className="mb-10">
          {eyebrow && <div className="text-xs uppercase tracking-wider text-leaf">{eyebrow}</div>}
          <h2 className="mt-1 font-display text-3xl font-bold">{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function Pill({ tone, children }: { tone: "success" | "leaf" | "sun" | "danger"; children: React.ReactNode }) {
  const map = {
    success: "bg-leaf-soft text-leaf",
    leaf: "bg-leaf/10 text-leaf",
    sun: "bg-sun-soft text-earth",
    danger: "bg-danger/10 text-danger",
  } as const;
  return <span className={`chip ${map[tone]}`}>{children}</span>;
}
