## AgriTrust AI — Simple Kenyan Rebuild

I'll keep the database (Supabase tables already match the requirements) and Neo4j integration, then wipe the UI and rebuild around a focused loan-officer demo flow. Masumi marketplace and the data-purchase paywall are removed entirely.

### Design system (`src/styles.css`)
Warm rural-finance palette:
- Deep green `#1F5A3D` (primary), Light green `#A8D5BA`, Earth brown `#7A5230`, Warm yellow `#F4B942`, White `#FFFFFF`, Charcoal `#2B2B2B`
- Fonts: Plus Jakarta Sans (headings) + Inter (body), loaded via `<link>` in `__root.tsx`
- Big tap targets, soft shadows, simple cards, no glassmorphism

### Pages to build (clean route tree)

```text
/                       Landing
/farmer-intake          5-step intake form
/farmer/$id             Farmer profile + trust score + AI explanation
/farmer/updates         Submit farm record updates (improves score)
/lender                 Loan officer dashboard (KPIs + farmer table + filters)
/lender/farmer/$id      Loan review workspace (decision buttons + audit trail)
/graph/$farmerId        Neo4j relationship view (falls back to demo graph)
/ussd                   USSD simulator for *483*900#
/auth                   Loan-officer sign in
```

All existing routes (`farmer.*`, `lender.*` shells, marketplace, masumi, agent, assistant, climate, reports, etc.) are deleted.

### Backend
- Keep tables: `profiles`, `farmer_profiles`, `farm_records`, `loan_applications`, `trust_scores`, `ussd_sessions`, `audit_events`, `user_roles`.
- Delete Masumi/marketplace code: `data_products`, `data_purchases`, `data_consents`, `wallets`, `marketplace_payouts`, `agent_jobs` (migration drops tables; server files removed).
- Keep server fns: trust scoring (simplified to the 9-component weights in the prompt), farm records, loans, Neo4j sync, USSD route.
- Remove: `agent.functions.ts`, `agritrust-agent.server.ts`, `masumi.server.ts`, `marketplace.functions.ts`, `/api/public/agent/*`.

### Trust score (rewrite to spec)
Weights out of 100: repayment 25, coop 15, farm records 15, mobile money 10, savings 10, input purchases 10, training 5, climate resilience 5, insurance 5. Gender/age/disability/land = inclusion context, never penalised. Risk bands 80/60/40. Every score returns a plain-language explanation (Gemini via Lovable AI, with deterministic fallback).

### Demo data
Seed 6 Kenyan farmer profiles (Mary, Brian, Aisha, Peter, Grace, Joseph) via migration so the dashboard is populated on first load.

### Auth
Loan-officer email + Google sign in only. Farmer intake stays public (rural officers register farmers on their behalf — no farmer login required for the demo). Existing `_authenticated` layout gates `/lender/*`.

### Out of scope (explicitly removed)
Masumi, data marketplace, wallets, agent jobs, accessibility settings drawer, multi-portal farmer dashboard, climate analytics page, reports/exports, assistant drawer, separate farmer login.

### Demo story the build supports
Register Mary → intake form → graph + score generated → loan officer opens `/lender`, filters Nakuru, clicks Review → sees trust breakdown, graph, climate, AI rationale → Approves with conditions → audit row written. Separately, `/ussd` shows the same loan flow over *483*900#.
