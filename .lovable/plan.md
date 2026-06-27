## Goal

Activate the full backend for AgriTrust AI: data marketplace (farmers sell verified data to lenders), USSD access, and turn on backend features (loans, trust scores, AI assistant, climate cache, audit logs) backed by Supabase + Neo4j.

---

## Status

### Done (this round)
- **Database** — new tables: `data_products`, `data_purchases`, `data_consents`, `wallets`, `marketplace_payouts`, `ussd_sessions`, `audit_events`, `climate_snapshots`. Full RLS + GRANTs + triggers. Wallet auto-credits on purchase + farmer notification.
- **Marketplace server fns** (`src/lib/marketplace.functions.ts`) — list/upsert products, browse, purchase, sales, wallet, revoke consent. Each purchase writes a `(:Farmer)-[:SOLD_DATA]->(:Lender)` edge in Neo4j and an `audit_events` row.
- **Marketplace UI** — `/farmer/marketplace` (wallet, listings, sales, opt in/out) and `/lender/marketplace` (browse catalogue, purchase, history). Added to both nav menus.
- **USSD route** — `/api/public/ussd` handling root menu, trust score lookup, loan apply, loan status, weather lookup, marketplace opt in/out. Africa's Talking creds stored as `AT_USERNAME`, `AT_API_KEY`, `AT_USSD_CODE`.
- **Trust Score engine** — `computeMyTrustScore` server fn writes weighted SHAP-style components (Behavior 25 / Financial 20 / Community 15 / Agricultural 15 / Climate 15 / Digital 10) to `trust_scores` with positive/negative factors.
- **AI Assistant fn** — `askAssistant` calls Lovable AI Gateway (`google/gemini-2.5-flash`) grounded in farmer profile + latest trust score (farmer) or recent applications (lender).

### Africa's Talking — next steps for you
1. In Africa's Talking sandbox, set the USSD callback URL to:
   `https://agritrust-ai.lovable.app/api/public/ussd`
2. Dial `*384*<your-channel>#` in the simulator to test.
3. When ready for production, swap to your live shortcode and update `AT_USSD_CODE`.

---

## Open follow-ups (not yet wired)

- **Paystack payouts** — need your Paystack secret key (`PAYSTACK_SECRET_KEY`) to settle wallet balances to farmer accounts. Until then balances accrue in `wallets`.
- **Misumi consent layer** — no public Misumi API was supplied; the current marketplace uses our native consent/access-token model. Send creds + docs link if you want to swap.
- **Wire `/farmer/assistant` + `/lender/assistant` UI** to `askAssistant` (the fn is live; the chat pages still render mock messages).
- **pg_cron jobs** — weekly climate cache refresh, USSD session cleanup, trust-score recompute. Easy to add once cadence confirmed.
- **SMS via Africa's Talking** — outbound SMS on loan status changes for USSD-only farmers.

Reply with the Paystack key (or "skip for now") and I'll wire payouts + the assistant chat.
