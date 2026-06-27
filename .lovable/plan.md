# AgriTrust AI — Farmer & Lender Dashboards

Build two role-based dashboard experiences sharing the same design language (glassmorphism, OKLCH tokens already in `styles.css`) but with fully separated navigation, pages, and permissions. All data is realistic mocked data for now — no schema changes. Auth, roles, and gating already exist.

## Shared shell (`src/components/dashboard/`)

- `DashShell.tsx` — responsive layout: collapsible sidebar (icon-mini on mobile/desktop collapse) + sticky top bar.
- `TopBar.tsx` — search, language switcher (EN/SW), theme toggle (light/dark), notifications popover, voice assistant button, profile dropdown, accessibility menu trigger (reuses existing `A11ySettingsButton`).
- `SideNav.tsx` — accepts nav item list; uses TanStack `Link` + `useRouterState` for active state.
- `AIAssistantDock.tsx` — floating button + slide-over chat panel (mocked replies, voice input/output buttons stubbed).
- Shared primitives lifted from current `farmer.tsx`: `Card`, `KpiCard`, `StatusPill`, `Sparkline`, `Bars`, plus new `Gauge`, `Heatmap`, `DonutChart`, `NetworkGraph` (SVG force-directed mock), `ShapBars`, `DataTable`.
- Theme toggle: add `dark`/`light` class on `<html>`, persist in localStorage. Current tokens are dark; add a light palette block.
- Language: tiny `i18n.tsx` context with EN/SW dictionaries for nav labels and key headings.

## Farmer routes (`src/routes/farmer.*`)

Convert `farmer.tsx` → layout (`farmer.tsx` renders `DashShell` + `<Outlet/>`), then leaf routes:

- `farmer.index.tsx` — Overview (greeting, Trust gauge, KPI grid, charts, AI recs, checklist, quick actions, notifications).
- `farmer.profile.tsx` — personal info form (read-only mock).
- `farmer.farm.tsx` — farm profile (crops, size, GPS, photos placeholders).
- `farmer.trust-score.tsx` — sub-scores radial, SHAP factor bars, positive/negative contributors, confidence.
- `farmer.credit.tsx` — readiness checklist with "How to improve" drawers.
- `farmer.loans.tsx` — application list + new-application wizard (mock).
- `farmer.assistant.tsx` — full-page AI chat.
- `farmer.climate.tsx` — rainfall/temp/NDVI charts, alerts, crop recs.
- `farmer.analytics.tsx` — production, income, savings, mobile money charts.
- `farmer.cooperative.tsx` — coop ranking, members, trainings.
- `farmer.network.tsx` — interactive SVG relationship graph (Farmer ↔ Coop, Bank, Buyers, Suppliers, Weather, Officer).
- `farmer.reports.tsx` — downloadable report cards (PDF/Excel buttons, mock).
- `farmer.notifications.tsx` — full notifications list.
- `farmer.settings.tsx` — preferences, language, accessibility shortcuts.

## Lender routes (`src/routes/lender.*`)

Same pattern; `lender.tsx` becomes layout shell.

- `lender.index.tsx` — exec KPIs, approval trend, Trust distribution, county heatmap, gender/youth/disability inclusion donuts, recent applications table, AI insights panel.
- `lender.farmers.tsx` — searchable farmer directory with filters (county, crop, gender, age, farm size, Trust, climate, coop, disability) and sort.
- `lender.farmers.$id.tsx` — full farmer profile (personal, farm, trust, loans, climate, repayment, mobile money, production, relationships, graph, recs, docs, timeline).
- `lender.applications.tsx` — queue table → click opens Loan Decision Workspace.
- `lender.applications.$id.tsx` — decision workspace (summary, trust, risk, climate, confidence, SHAP, recommendation, approve/conditional/review/reject buttons → toast + mock audit log entry).
- `lender.trust.tsx` — score distributions and drill-down.
- `lender.graph.tsx` — large interactive graph w/ algorithm toggles (PageRank, Centrality, Community, Link Prediction) — visual stub with legend.
- `lender.climate.tsx` — county map (SVG of Kenya regions), drought/flood/rainfall layers, alerts.
- `lender.explainability.tsx` — sample applicant explanations, bias check, human-review flag.
- `lender.portfolio.tsx` — portfolio KPIs, performance, expected loss, ROI charts.
- `lender.risk.tsx` — default prediction, concentration, climate-adjusted risk.
- `lender.reports.tsx` — institution/portfolio/county/climate/trust/inclusion/impact reports.
- `lender.assistant.tsx` — enterprise copilot chat.
- `lender.settings.tsx` — institution settings.
- `lender.notifications.tsx` — full list.

## Design system additions (`src/styles.css`)

- Add `:root` light palette + `.dark` block (current tokens become `.dark`); default to dark to preserve current look.
- Add `.glass-panel`, `.grid-bg`, scroll styles for sidebar.
- New utility colors already present (emerald/sky/gold/rose/violet) — reuse.

## Out of scope (this phase)

- Real LLM/voice integration — buttons + UI shells only with TODO comments.
- Real PDF/Excel generation — buttons trigger toast.
- DB-backed loan workflow — uses mocked arrays in `src/lib/mock-data.ts`.
- Map tiles — use stylized SVG region map, no external map provider.

## Technical notes

- All new routes are flat dot-files under `src/routes/`, each wrapped in `<RequireAuth role="farmer|lender">`.
- The shell handles role-aware nav, so each leaf route just renders its content inside.
- TanStack `Link` with `params` for `$id` routes.
- Charts remain hand-rolled SVG (no new chart deps) to keep bundle light and match current look.
- Single new dep consideration: none required.

Approve and I'll implement in batched parallel writes (shell + farmer routes + lender routes + mock data + styles).
