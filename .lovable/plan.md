## Goal

Activate the full backend for AgriTrust AI: a Misumi-powered farmer data marketplace (farmers sell verified data to lenders), USSD access for feature-phone farmers, and turn on all currently-stubbed backend features (loans, trust scores, notifications, AI advisor, climate cache, audit logs) backed by the existing Supabase + Neo4j stack.

---

## 1. Data Marketplace (Misumi)

Misumi is a data-monetization / consent layer. Farmers list datasets (farm records, mobile-money summary, yield history, trust score snapshot, geolocation, climate exposure). Lenders browse, request, pay, and receive a time-boxed, consented payload. Every transaction is logged on-chain-style in Postgres + mirrored as a `SOLD_TO` edge in Neo4j.

New tables (Supabase, with RLS + GRANTs):
- `data_products` — farmer-owned listings (type, price, sample, refresh cadence)
- `data_purchases` — lender purchase records (status, amount, expires_at, access_token)
- `data_consents` — explicit farmer consent log (purpose, scope, revoked_at)
- `marketplace_payouts` — farmer earnings ledger
- `wallets` — balance per user (farmer earnings, lender prepaid credits)

New routes:
- `/farmer/marketplace` — list/manage data products, view earnings
- `/lender/marketplace` — browse catalogue, purchase, access purchased data
- Server fns: `listProducts`, `createProduct`, `purchaseProduct`, `grantAccess`, `revokeConsent`, `getPurchasedPayload`

Neo4j: write `(:Farmer)-[:SOLD_DATA {product,ts}]->(:Lender)` on each purchase to enrich the graph intelligence views.

---

## 2. USSD Channel

Africa's Talking USSD gateway (most reliable for KE/multi-country). Farmers dial a shortcode and can:
- Register / link to existing account via phone OTP
- Check Trust Score
- Apply for a loan (amount, purpose, tenor)
- Check loan status
- Get weather + advisory for their county
- Toggle data marketplace listing (opt-in/out)

Implementation:
- Public server route `src/routes/api/public/ussd.ts` (POST, Africa's Talking format, signature/IP allowlist verification)
- Session state stored in `ussd_sessions` table (sessionId, phone, step, payload)
- Phone→user lookup via `profiles.phone`; create shadow profile on first dial
- All actions reuse the same server fns as the web app (single source of truth)

---

## 3. Activate All Backend Features

Currently mock-driven. Wire to real data:

- **Trust Score engine** — server fn `computeTrustScore(userId)` reads `farmer_profiles`, `loan_applications` history, Neo4j centrality, climate exposure → writes `trust_scores` row with SHAP factors (positive/negative JSON). Recomputed on profile/loan changes via trigger + cron.
- **Loan applications** — full CRUD, status machine (draft→submitted→under_review→approved/declined→disbursed→repaying→closed), officer assignment, decision audit log table.
- **Notifications** — DB trigger on loan status / new purchase / score change → inserts into `notifications` → realtime channel for web, SMS via Africa's Talking for USSD users.
- **AI Assistant (Farmer + Lender)** — server fn calling Lovable AI Gateway (google/gemini-2.5-flash). Farmer: advisory grounded in their farm + climate data. Lender: portfolio Q&A grounded in their applications + farmers.
- **Climate cache** — store Open-Meteo pulls in `climate_snapshots` keyed by (county, week) to cut latency and API load; cron refresh weekly.
- **Graph sync** — server fn `syncFarmerToNeo4j(userId)` writes/updates `(:Farmer)` node and `(:Cooperative)`, `(:Lender)`, `(:Buyer)` relationships from Postgres on profile save.
- **Audit log** — `audit_events` table for every lender decision and data purchase (immutable, append-only via RLS).
- **Reports** — server fns to generate PDF/CSV exports (farmer statement, lender portfolio).
- **Cron** — pg_cron jobs for: trust-score recompute, climate refresh, USSD session cleanup, payout settlement.

---

## Technical Notes

```text
Web ──┐
USSD ─┼─► Server Fns (TanStack Start) ──► Postgres (RLS) ──► Neo4j sync
SMS ──┘                                ├─► Lovable AI Gateway
                                       ├─► Open-Meteo (cached)
                                       ├─► Misumi consent/payment
                                       └─► Africa's Talking (USSD/SMS)
```

All server fns gated by `requireSupabaseAuth` except public webhooks under `/api/public/*` (signature-verified). Marketplace payments settle to `wallets`; payout to M-Pesa is a follow-up.

---

## Input I Need From You

1. **Misumi credentials** — API key, account/merchant ID, webhook secret, sandbox vs production. Also: confirm pricing model (per-record, subscription, or one-off per dataset) and default price floor.
2. **Africa's Talking** — username, API key, USSD shortcode (or confirm you want me to wire it for sandbox `*384*XXXX#` first), SMS sender ID.
3. **Country / currency scope** — Kenya only (KES, +254) for v1, or multi-country from day one?
4. **Payout rail** — M-Pesa B2C via Africa's Talking (needs separate product code + initiator credentials) or hold balances in-app and add payout later?
5. **AI model preference** — default to `google/gemini-2.5-flash` (free during promo, fast) for the assistant, or you want `gpt-5` quality?
6. **Trust Score weights** — use my proposed defaults (Behavior 25%, Financial 20%, Community 15%, Agricultural 15%, Climate 15%, Digital ID 10%) or supply your own?
7. **Data product catalogue** — confirm starter list: Farm Records, Yield History, Mobile-Money Summary, Trust Score Snapshot, Climate Exposure, Geolocation. Add/remove any?
8. **Consent defaults** — max access window per purchase (e.g. 30 days), and whether farmers must approve each purchase or can pre-authorize a lender.

Reply with whatever you have; I'll request remaining secrets via the secure form when we start implementing each section.
