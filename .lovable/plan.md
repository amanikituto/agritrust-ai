
# AgriTrust AI — AFRACA MVP Stabilization Plan

Goal: stabilize and connect existing features so a judge can run the full "invisible farmer → fair credit decision" story end-to-end in under five minutes. No redesign, no removed features. Work is ordered exactly per the brief and ships in vertical slices so each phase is demoable on its own.

## Phase 1 — Neo4j Graph Integration

- Harden `src/lib/neo4j.server.ts`: connect once, retry transient failures, fall back to a typed mock dataset when credentials are missing or the driver errors. Never throw to the route.
- Extend `src/lib/graph.functions.ts` with a richer schema (Farmer, Loan Officer, Lender, Loan, Cooperative, Farm, Crop, Climate/Pest Event, Input Supplier, Buyer, Savings Group, Training, Extension Officer, Repayment, Mobile Money) and matching relationships.
- Add a `seedGraphForFarmer(farmerId)` server fn that idempotently MERGEs the farmer plus their related nodes/edges from Supabase records (called after intake + each record update).
- Lender `Graph` page and Application workspace both render either live Neo4j or labelled "Demo graph" — same component, swap source flag.

## Phase 2 — Farmer Intake Form

- New route `src/routes/farmer.intake.tsx` (multi-step: Personal → Inclusion → Farm → Financial → Climate → Cooperative → Consent).
- Migration: extend `farmer_profiles` with the missing alternative-data columns (inclusion flags, irrigation, storage, mechanization, insurance, climate risks JSON, cooperative role, consent flag + timestamp). All new fields nullable so existing rows survive.
- Server fn `saveFarmerIntake` writes the profile, triggers `seedGraphForFarmer`, and recomputes the trust score.
- Inclusion fields are stored and shown but **never** fed as negative signals to the scorer (enforced in code + commented).

## Phase 3 — Farmer Record Updates

- New table `farm_records` (type enum: planting, harvest, input_purchase, sale, repayment, training, extension_visit, coop_meeting, weather_damage, pest_outbreak, insurance, savings_deposit, equipment). RLS: farmer owns rows, lender staff can read.
- New route `src/routes/farmer.records.tsx` with a simple "Add update" form + history timeline.
- Each insert: appends a Trust Signal, MERGEs the matching Neo4j edge, and re-runs `computeMyTrustScore`.

## Phase 4 — Dynamic Trust Score

- Rewrite `src/lib/trust-score.functions.ts` with the AFRACA weights (repayment 25, coop 15, production 15, mobile money 10, savings 10, inputs 10, training 5, climate resilience 5, insurance 5, community 5).
- Scorer reads from `farmer_profiles`, `farm_records`, `loan_applications`. Missing data degrades gracefully (component contributes neutral 50, not 0).
- Returns `{score, components, positives, negatives, recommendations, narrative}` with a human-readable narrative string.
- Hard rule: gender, age, disability, land ownership never contribute negatively — unit-tested with a fixture.

## Phase 5 — Loan Officer Decision Workspace

- Keep current route `src/routes/lender.applications.$id.tsx`; reorganize into the AFRACA layout: Farmer Summary, Signals grid (climate, pest, coop, mobile money, repayment, production), Graph snapshot, Credit Readiness panel with AI explanation, Recommended size/term.
- Keep the existing Masumi paywall flow (already working) — just feed it the richer profile.
- Decision buttons: Approve / Approve with Conditions / Request Info / Reject (extend `loan_applications.status` enum + `decideApplication`).
- Every recommendation renders the four explainability questions.

## Phase 6 — USSD Offline Lending

- Extend `src/routes/api/public/ussd.ts` menu: 1 Apply, 2 Trust Score, 3 Loan Status, 4 Update Records, 5 Climate Alerts, 6 Exit.
- USSD-created loans set `loan_applications.source = 'ussd'`; lender queue badges them as "USSD".
- Add a `/ussd-sim` route with a phone-keypad UI that POSTs to the same endpoint so judges can demo without Africa's Talking.

## Phase 7 — Masumi Integration (lightweight)

- Keep current adapter. Add a `summarizeFarmerForLender` server fn that calls Masumi for the explanation and falls back to Lovable AI Gateway (`google/gemini-3-flash-preview`) on any error. Never blocks UI.

## Phase 8 — Demo Data, Filters, Compliance

- Migration seeds 8 Kenyan farmer fixtures (each persona from the brief) with profiles, records, loans, trust scores, and Neo4j MERGEs.
- Lender directory filters: county, crop, gender, youth, disability, cooperative, climate risk, trust band, repayment, loan status, mobile money, credit readiness, women farmers. Filters wired to existing `listFarmersDirectory`.
- Add `audit_events` writes on every score + decision (table already exists).
- Intake consent checkbox stored on profile; profile read requires it before Masumi unlock.

## Technical notes

- All new server fns in `src/lib/*.functions.ts` (client-safe), helpers in `*.server.ts`.
- Migrations include explicit `GRANT` blocks per project rules.
- Each phase ends with a smoke test (Playwright headless) of the demoable flow before moving on.
- No UI redesign: reuse `DashShell`, `Card`, `KpiCard`, `Gauge`, `NetworkGraph` primitives throughout.

Shall I proceed phase-by-phase starting with Phase 1 (Neo4j hardening + richer schema)?
