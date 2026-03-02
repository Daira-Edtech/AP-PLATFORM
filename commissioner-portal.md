# Commissioner Portal Migration

## Goal
Port all pages from `jiveesha-state-commissioner-portal/` (Vite SPA) into the Next.js app under `/commissioner/*` routes. Keep existing UI/functionality, adapt to Next.js file-based routing.

## Architecture
- Source: Vite SPA with `AppView` enum switching → 13 views
- Target: Next.js `src/app/commissioner/` with file-based routes
- Components: Copy to `src/components/commissioner/` as client components (`'use client'`)
- Types/constants: Copy to `src/lib/commissioner/`
- Services: Copy to `src/lib/commissioner/services/` (already use Supabase client)
- Static assets: Copy `ap_satellite.png` to `public/`

## Route Mapping

| AppView | Next.js Route | Component |
|---------|--------------|-----------|
| Dashboard | `/commissioner/dashboard` | ExecutiveDashboard |
| Districts | `/commissioner/districts` | DistrictComparison + drilldown |
| Geographic Map | `/commissioner/map` | GeographicMapView |
| Screening & Risk | `/commissioner/screening` | ScreeningRiskView |
| Impact Analytics | `/commissioner/analytics` | ImpactAnalyticsView |
| Policy Insights | `/commissioner/policy` | PolicyInsightsView |
| Escalations | `/commissioner/escalations` | EscalationView |
| Referral Health | `/commissioner/referrals` | ReferralHealthView |
| Workforce | `/commissioner/workforce` | WorkforceOverview |
| Children | `/commissioner/children` | ChildrenDirectory |
| Cabinet Briefs | `/commissioner/briefs` | BriefsReportsView |
| Settings | `/commissioner/settings` | SettingsView |

## Tasks (Page by Page)
- [ ] 1: Copy shared files — types, constants, services, assets → Verify: imports resolve
- [ ] 2: Build commissioner layout — sidebar + navbar + breadcrumbs (from App.tsx) → Verify: nav renders at `/commissioner/dashboard`
- [ ] 3: Dashboard page — `ExecutiveDashboard` + `KPICard` + `StateMap` → Verify: dashboard loads with KPI cards
- [ ] 4: Districts page — `DistrictComparison` + `DistrictDetail` + `HierarchyDrillDown` → Verify: drill-down navigation works
- [ ] 5: Remaining pages — Map, Screening, Analytics, Policy, Escalations, Referrals, Workforce, Children, Briefs, Settings → Verify: each page renders
- [ ] 6: Final verification — full browser walkthrough of all pages

## Notes
- All components become `'use client'` since they use React state/effects and recharts
- Import paths change from `../types` → `@/lib/commissioner/types`
- Supabase client import changes from `../lib/supabase` → `@/lib/supabase/client`
- Login.tsx and AuthContext.tsx are NOT needed (Next.js handles auth via layout/middleware)
