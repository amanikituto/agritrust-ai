# AgriTrust AI — Expansion Plan

The request spans 17 feature areas. Building all of them in one pass would produce shallow stubs. I propose a phased rollout where each phase is a usable, demo-ready slice.

## Foundation (this phase)

1. **Enable Lovable Cloud** — required for auth, profiles, roles, loan data, notifications.
2. **Database schema**
   - `profiles` (one row per auth user, shared fields)
   - `farmer_profiles` (county, crops, livestock, gender, disability info, language, comms preference)
   - `lender_profiles` (institution, branch, type, license, role)
   - `user_roles` table + `app_role` enum (`farmer`, `loan_officer`, `credit_manager`, `institution_admin`, `system_admin`) with `has_role()` security-definer function — never store roles on profiles
   - `loan_applications`, `trust_scores`, `notifications` (seed mock data via migration)
3. **Auth (email + Google)** with role selection during signup → routes to the right dashboard. Magic link / phone / Microsoft come in a later phase.
4. **Landing page split** — add the two prominent "I'm a Farmer" / "I'm a Financial Institution" entry points to the existing hero.
5. **Route architecture**
   - `_authenticated/` gate (managed)
   - `/farmer` dashboard shell with KPI cards, trust score gauge, credit-readiness checklist, AI recommendations, quick actions, notifications
   - `/lender` dashboard shell with portfolio KPIs, loan queue table, gender analytics card, regional snapshot
6. **Accessibility baseline** — semantic HTML, focus-visible, prefers-reduced-motion, contrast tokens, alt text. Settings drawer (large text / high contrast / reduce motion / dyslexia font) wired to a context that toggles `<html>` classes.

## Phase 2 (next)
- Loan application flow + Explainable AI decision panel (SHAP-style bars, top + / − factors, climate impact, graph relationships, bias check, improvements)
- Lender loan review workspace with approve/reject + audit trail
- Gender-Inclusive analytics dashboard with bias monitoring

## Phase 3
- Voice AI Assistant (floating mic, Lovable AI Gateway STT + chat + TTS, English/Swahili)
- AI Farm Advisor + Financial Literacy Center
- Notification center (in-app first; SMS/email/WhatsApp later via connectors)

## Phase 4
- Community Hub, Family/Household profile, ESG & Impact dashboard, Admin console, Responsible AI governance page, PWA/offline polish

## Technical Notes

- **Stack**: TanStack Start + Tailwind v4 + shadcn (already in place). Add Lovable Cloud (Supabase under the hood) for auth + DB.
- **Roles**: separate `user_roles` table + `has_role()` SECURITY DEFINER. RLS on every table. Public schema GRANTs explicit.
- **Auth gate**: integration-managed `_authenticated/route.tsx`. Role-based subroutes (`_authenticated/farmer/*`, `_authenticated/lender/*`) check `has_role` server-side.
- **AI**: Lovable AI Gateway (`google/gemini-3-flash-preview` default; `openai/gpt-4o-mini-transcribe` for voice).
- **Mock data**: seed via migration so dashboards look real on first login.

## What I need from you

1. **Scope confirmation**: OK to start with the Foundation phase above (auth + roles + farmer & lender dashboard shells + accessibility baseline + landing split), then iterate?
2. **Cloud**: I'll enable Lovable Cloud as part of Foundation — confirm.
3. **Auth methods for v1**: email + Google only, or do you also want phone/OTP and Microsoft now? (Phone/Microsoft add real setup time.)
4. **Demo data**: should I seed ~20 mock farmers and ~5 loan applications so dashboards look populated? (Recommended for demos.)

Reply with answers (or just "go") and I'll start building Foundation.
