## Goal
Make the USSD channel (`*483*900#`) first-class inside the Farmer dashboard so farmers without smartphones — and judges reviewing the demo — can discover, learn, and test it without leaving the portal.

## Where it goes
- **Primary placement:** a new sidebar item **"USSD Access"** in `FARMER_NAV` (between *Record Updates* and *My Profile*), opening `/farmer/ussd`. Icon: `Phone` (lucide).
- **Secondary placement:** a compact **"USSD shortcut" card** on the Overview (`farmer.index.tsx`) showing the dial string, the registered phone number, and a "Try simulator" button — so it's visible on first load without hunting through the sidebar.
- **Tertiary:** a small "Offline? Dial *483*900#" badge in the `DashShell` topbar (farmer portal only) — one line, dismissible.

## New page: `/farmer/ussd`
Single screen, three sections, all read-only data so it works on any device:

1. **Dial card** — big `*483*900#` string with copy button, the farmer's registered phone (from `profiles.phone`), and a 1-line status: "Active on Safaricom · Africa's Talking sandbox".
2. **Menu map** — static list mirroring the live USSD handler (Apply for loan, Check trust score, Loan status, Update records, Climate alerts, Exit) so the farmer knows what they'll see before dialing.
3. **Embedded simulator** — reuse the existing `/ussd-sim` keypad UI as a component so the farmer can rehearse the flow inside the dashboard. Defaults the phone number to the signed-in farmer's `profiles.phone`.
4. **Recent USSD sessions** — last 5 rows from `ussd_sessions` for this farmer's phone (read-only, server fn using `supabaseAdmin` filtered by phone), each showing timestamp + last menu reached. Skipped gracefully if no phone on profile.

## Technical details
- Refactor `src/routes/ussd-sim.tsx` body into `src/components/farmer/UssdSimulator.tsx` (props: `defaultPhone`). Keep `/ussd-sim` working by having it render the component — no behavior change for judges.
- New route file `src/routes/farmer.ussd.tsx` composing the three sections; uses `useQuery` for the profile phone and recent sessions.
- New server fn `getMyRecentUssdSessions` in `src/lib/ussd.functions.ts` — `requireSupabaseAuth`, loads `profiles.phone` for `userId`, then `supabaseAdmin.from("ussd_sessions").select(...).eq("phone", phone).order(...).limit(5)`. Admin client is required because `ussd_sessions` is fail-closed RLS.
- Add `{ to: "/farmer/ussd", label: "USSD Access", icon: Phone }` to `FARMER_NAV` in `src/lib/dashboard-nav.ts`.
- Overview card lives in `farmer.index.tsx` — small `Card` with dial code, copy-to-clipboard, and `<Link to="/farmer/ussd">`.
- Topbar badge added to `DashShell` only when `portal === "Farmer"`.

## Out of scope
- No changes to the USSD endpoint, menu wording, or Africa's Talking config.
- No SMS sending or click-to-dial deep links beyond `tel:` on the dial card.
- No new tables or migrations.

Ready to implement on approval.