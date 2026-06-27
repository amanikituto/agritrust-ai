# Plan: Lender visibility fix + Masumi agent-to-agent flow

Three tracks, smallest-first so each is verifiable on its own.

---

## Track 1 — Lenders don't see newly registered farmers

**Root cause (most likely):**
1. `farmer_profiles` / `profiles` RLS only allows the owner to `SELECT` their own row, so lender accounts get an empty list.
2. `listFarmersDirectory` and `getFarmerDetail` run through `requireSupabaseAuth` (user-scoped client), so RLS silently filters everything out.
3. New signups create a `profiles` row but no `farmer_profiles` row until the farmer opens onboarding, so even with correct RLS the directory misses them.

**Fix:**
- Add a SQL migration:
  - Policy: `authenticated` with `has_role(auth.uid(), 'lender')` can `SELECT` from `profiles`, `farmer_profiles`, `trust_scores`, `loan_applications`.
  - Trigger on `auth.users` insert (or extend the existing one) so every new user with `account_type='farmer'` gets a stub `farmer_profiles` row.
  - Confirm `GRANT SELECT ... TO authenticated` exists for each table.
- In `listFarmersDirectory` / `getFarmerDetail`, keep the user-scoped client (RLS now permits it) and `LEFT JOIN` profiles so farmers without a trust score still appear with "—".
- Show a tag in the directory when `farmer_profiles` is missing ("Onboarding incomplete") instead of hiding the row.

## Track 2 — Broken lender buttons / inputs

Audit pass across `src/routes/lender.*.tsx`:
- Replace any `<button>` without `onClick` and any link styled as a button that doesn't navigate.
- Wire filter chips on `lender.applications.tsx`, `lender.portfolio.tsx`, `lender.risk.tsx`, `lender.trust.tsx` to local state that actually filters the rendered list.
- Make report downloads in `lender.reports.tsx` produce a file (Blob + `URL.createObjectURL`) instead of being inert.
- Make the assistant drawer submit on Enter and disable while pending.
- For each fixed control, drive Playwright via shell against the running preview to click it and screenshot the result.

(Exact button list will be enumerated during the audit pass — I'll list every file touched in the build summary.)

## Track 3 — Masumi agent-to-agent payment (Lender Agent → AgriTrust Agent)

Keep it inside the existing TanStack Start app — no separate Python service.

**New modules**
- `src/lib/masumi.server.ts` — thin client wrapper:
  - `discoverAgent(capability)` → calls Masumi registry, returns `{ agentId, endpoint, pricing }`.
  - `payAndInvoke({ agentId, payload, tierKes })` → creates a Masumi job, returns `{ jobId, escrowTx, explorerUrl, result }`. Mocked by default; real SDK call gated on `MASUMI_API_KEY`.
  - `verifyMasumiSignature(req)` for inbound calls.
- `src/lib/agritrust-agent.server.ts` — the seller side. Given `{ farmerId, tier }`, reads Neo4j (`runQuery`) + Supabase to assemble a tiered credit-intelligence payload (basic / standard / premium), runs the existing trust-score weights, returns DTO + signed receipt.

**New routes**
- `src/routes/api/public/agent/discover.ts` — GET, returns AgriTrust agent metadata for Masumi discovery.
- `src/routes/api/public/agent/invoke.ts` — POST, verifies Masumi signature, then calls `agritrust-agent.server.ts`. Returns the credit profile + a second mocked Masumi tx for the outbound climate-data agent call (demonstrating agent-to-agent payment).
- `src/lib/agent.functions.ts` — `lenderRequestFarmerProfile({ farmerId, tier })`: server fn used by the lender UI. Internally calls `discoverAgent('agritrust.credit')` then `payAndInvoke(...)`.

**New UI**
- `src/routes/lender.agent.tsx` — "AgriTrust Marketplace" page: pick a farmer + tier, see price in KES, click **Pay & fetch** → shows job id, escrow tx (linked to explorer), and the returned credit profile with an "Audit verified" badge.
- Embed a small "Request via AgriTrust Agent" button on `lender.farmers.$id.tsx` that runs the same flow inline.
- Public `src/routes/agent.tsx` discovery page (read-only marketing/description, links to the discover endpoint).

**Secrets / config**
- Add `MASUMI_API_KEY`, `MASUMI_AGENT_ID`, `MASUMI_NETWORK` (preprod/mainnet) as runtime secrets — when missing, the wrapper runs in mocked mode and clearly labels responses `MOCKED`.
- All Neo4j and Supabase reads continue to use existing credentials.

**Trust score**
- Add a parallel `computeMasumiScore` in `src/lib/trust-score.functions.ts` using the Masumi weights (mobile_money 0.25, coop 0.25, repayment 0.35, farm_data 0.15, minus climate penalty). Existing dashboard score is unchanged. Only the agent endpoint returns the Masumi score.

**Error handling**
- Every new endpoint returns JSON `{ error, code }` with proper HTTP status on bad input, missing farmer, signature failure, payment failure.

---

## Verification

- Migration applied → query `farmer_profiles` as a lender via `supabase--read_query`.
- Playwright: sign in as lender, open `/lender/farmers`, confirm a freshly registered farmer appears. Click each repaired button, screenshot.
- `stack_modern--invoke-server-function` to hit `/api/public/agent/discover` and `/api/public/agent/invoke` with a mocked Masumi signature; confirm both Masumi tx ids appear in the response.

## Open questions (will not block — sensible defaults chosen)

- Masumi credentials: defaulting to **mocked end-to-end with SDK adapter ready** unless you paste a `MASUMI_API_KEY`.
- Pricing tiers: defaulting to KES 50 / 150 / 400 (basic / standard / premium) — easy to change later.
