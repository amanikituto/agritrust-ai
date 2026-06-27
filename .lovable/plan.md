## Goal

Make the lender Applications "Review" button drive a Masumi-mediated agent-to-agent flow: Lender Agent discovers and pays the AgriTrust Agent → AgriTrust queries Neo4j + Supabase → credit profile is unlocked and shown in the review workspace. Retire the standalone "AgriTrust Agent" page and the "Data Marketplace" page since this flow replaces them.

## User-visible behavior

1. On `/lender/applications`, each row's **Review** button opens `/lender/applications/$id`.
2. The review page loads the application + farmer summary, but the credit profile section is **locked** behind a paywall card showing:
   - Tier selector (Basic / Standard / Premium) with KES pricing from Masumi discovery
   - "Pay with Masumi & Unlock" CTA
   - Short explainer: "Your Lender Agent will discover and pay the AgriTrust Agent via Masumi escrow"
3. Clicking the CTA runs the existing `lenderRequestFarmerProfile` server fn, which:
   - Calls Masumi discovery to resolve the AgriTrust agent (no hardcoded endpoint)
   - Opens escrow → invokes AgriTrust Agent → AgriTrust queries Neo4j + Supabase → returns signed profile
   - Records the job in `agent_jobs` (already wired)
4. On success the page swaps the locked card for the **unlocked credit profile**: trust score gauge, positive/negative factors, Neo4j relationship signals (if Premium), escrow tx hash + explorer link + signed receipt.
5. Approve / Reject / Request-info buttons remain, now enriched by the unlocked profile (and disabled until unlocked, with a "Decision requires profile" hint).
6. If the lender has already purchased a profile for this farmer (lookup in `agent_jobs` by `buyer_id + farmer_id`), skip payment and show the cached result with a "Previously purchased" badge.

## Navigation & cleanup

- Remove sidebar entries **AgriTrust Agent** (`/lender/agent`) and **Data Marketplace** (`/lender/marketplace`) from `src/lib/dashboard-nav.ts`.
- Delete routes `src/routes/lender.agent.tsx` and `src/routes/lender.marketplace.tsx`.
- Keep `src/lib/agent.functions.ts`, `masumi.server.ts`, `agritrust-agent.server.ts`, and the `/api/public/agent/*` endpoints — they are the engine for the new flow.
- Leave `farmer.marketplace.tsx` (farmer side) untouched unless you want it removed too — see Question 1.

## Files to edit / create

- `src/routes/lender.applications.tsx` — ensure each row's Review button is a `<Link to="/lender/applications/$id" params={{ id }}>`.
- `src/routes/lender.applications.$id.tsx` — add the Masumi paywall card, gated profile display, "already purchased" detection, escrow receipt panel; gate decision buttons.
- `src/lib/agent.functions.ts` — add `getExistingAgentJob({ farmerId })` so the review page can detect prior purchases.
- `src/lib/dashboard-nav.ts` — remove the two nav items.
- Delete `src/routes/lender.agent.tsx`, `src/routes/lender.marketplace.tsx`.

No DB migration is needed; `agent_jobs` already stores `result`, `escrow_tx`, `explorer_url`, `outbound_tx`, `is_mocked`.

## Technical notes

- Discovery stays inside `payAndInvoke` via `getAgritrustAgentInfo()`; the lender code never imports AgriTrust internals — only calls the Masumi-mediated server fn. This satisfies the "no hardcoded API" requirement.
- Pricing pulled from `listAgentInfo()` on mount so the tier card always reflects current Masumi tariffs.
- Cached purchase lookup uses RLS-scoped `agent_jobs` query (buyer = current lender user).

## Question

1. Should I also remove the **farmer-side** "Data Marketplace" route (`/farmer/marketplace`) and its nav entry, or keep it as the farmer's consent/earnings view? Default: keep it (farmers still need to see what was sold and earnings).
