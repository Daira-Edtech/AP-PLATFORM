# Commissioner Analytics Page — Dynamic Data Plan

## Goal
Replace all placeholder data in `/commissioner/analytics` (3 tabs) with live Supabase data, scoped to the commissioner's state.

## Architecture
**New API route:** `GET /api/commissioner/analytics?type=<endpoint>`  
**File:** `src/app/api/commissioner/analytics/route.ts`

> **⚠️ Note:** `referrals`, `interventions`, `intervention_plans` tables currently have **0 rows**. The API queries are wired to the real tables, but the frontend will show graceful empty states until data is populated.

---

## Placeholder → Real Data Mapping

### Programme Impact Tab

| Placeholder | Current Value | Real Data Source | Query Logic |
|-------------|--------------|------------------|-------------|
| Headline card `34,200 / 4,780 / 3,442` | Hardcoded | `children` + `referrals` + `interventions` | Count high/critical risk children, count referrals, count interventions with status `completed`/`in_progress` |
| `IDENTIFICATION IMPROVEMENT` | `340%` | Computed | Current identification rate vs baseline constant |
| `SCREENING GROWTH (YoY)` | `+28%` | `children.registered_at` | Compare this-year vs last-year screening counts |
| `REFERRAL COMPLETION` | `72%` | `referrals` | `completed / total * 100` |
| `AVG TIME TO INTERVENTION` | `11 days` | `referrals` + `interventions` | Avg diff between `referrals.created_at` and `interventions.created_at` for same child |
| `IMPACT_LONGITUDINAL_DATA` chart | 6 quarters hardcoded | `children.registered_at` + `flags` | Group registrations by quarter, compute high-risk rate per quarter |
| `INTERVENTION_PIPELINE_DATA` funnel | 6 stages hardcoded | `children` → `flags` → `referrals` → `interventions` | Count at each pipeline stage with drop-off % |

### Cohort Tracking Tab

| Placeholder | Current Value | Real Data Source | Query Logic |
|-------------|--------------|------------------|-------------|
| Cohort size `12,450` | Hardcoded | `children.registered_at` | Count children registered in selected quarter |
| Retention `92%` | Hardcoded | `children.is_active` | Active children / total in cohort |
| Timeline (5 steps) | Hardcoded dates | `children` + `referrals` stages | Derive from actual cohort data flow dates |
| `COHORT_OUTCOME_DATA` pie | 5 hardcoded % | `children.current_risk_level` + `referrals.status` + `interventions.status` | Aggregate outcomes for selected cohort |

### Before / After Tab

| Placeholder | Current Value | Real Data Source | Query Logic |
|-------------|--------------|------------------|-------------|
| `BEFORE_AFTER_DATA` (5 rows) | Hardcoded before/after | `children` + `referrals` + `flags` | `after` = live computed values; `before` = baseline constants (pre-programme) |

---

## Tasks

- [ ] Task 1: Create `src/app/api/commissioner/analytics/route.ts` with endpoints:
  - `type=impact-summary` → headline card numbers + KPIs
  - `type=longitudinal` → quarterly screening volumes + high-risk rates
  - `type=pipeline` → intervention funnel (screened → identified → referred → intervention → completed → follow-up)
  - `type=cohort` → cohort stats for selected quarter (size, retention, outcome distribution)
  - `type=before-after` → computed "after" metrics vs baseline constants
  → Verify: `tsc --noEmit` passes

- [ ] Task 2: Rewrite `ImpactAnalyticsView.tsx` — fetch from API per tab, remove all mock imports, add loading/empty states
  → Verify: page loads at `/commissioner/analytics`, no console errors

- [ ] Task 3: Update `BACKEND_API_DOCS_v4.1.md` with new analytics endpoints

## Done When
- [ ] All 3 tabs show live data (or graceful empty states when tables are empty)
- [ ] No `IMPACT_LONGITUDINAL_DATA`, `INTERVENTION_PIPELINE_DATA`, `COHORT_OUTCOME_DATA`, `BEFORE_AFTER_DATA` imports remain
