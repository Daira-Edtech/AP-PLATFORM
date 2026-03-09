# Commissioner Screening Page — Dynamic Data Plan

## Goal
Replace ALL placeholder/mock data in `/commissioner/screening` with live Supabase data scoped to the commissioner's state.

## Architecture
**New API route:** `GET /api/commissioner/screening?type=<endpoint>`  
**File:** `src/app/api/commissioner/screening/route.ts` (uses `createAdminClient` + user session for state filtering)

---

## Placeholder → Real Data Mapping

### Coverage Tab

| Placeholder | Current Value | Real Data Source | Query Logic |
|-------------|--------------|------------------|-------------|
| `TOTAL CHILDREN` | `5,10,000` | `children` table | `COUNT(*)` where `awc_id IN (state AWCs)` |
| `SCREENED` | `3,42,000` | `children` table | `COUNT(*)` where `last_screening_date IS NOT NULL` |
| `UNSCREENED` | `1,68,000` | Computed | `total - screened` |
| `COVERAGE RATE` | `67.1%` | Computed | `(screened / total) * 100` |
| `District Coverage Treemap` | `DISTRICT_MOCK_DATA.coverage` | `children` + `awcs` + `mandals` + `districts` | Group by district, compute `screened/total` per district |
| `Below Target Districts` | `DISTRICT_MOCK_DATA (coverage<60)` | Same as above | Filter districts with coverage < 70% |
| `Age Band Reach` | `AGE_BAND_STATS` (hardcoded) | `children.dob` | `child_age_months()` bucketed into 0-1, 1-2, ..., 5-6 yr bands |
| `Coverage by District (12 months)` | `generateLineData()` (random) | `children.last_screening_date` | Group by month + district for last 12 months |

### Risk Distribution Tab

| Placeholder | Current Value | Real Data Source | Query Logic |
|-------------|--------------|------------------|-------------|
| `HIGH RISK (SAM)` | `24,000` | `children` | `COUNT(*)` where `current_risk_level = 'high'` |
| `CRITICAL FLAGS` | `10,200` | `flags` | `COUNT(*)` where `priority = 'critical'` and child in state |
| `MEDIUM RISK` | `67,800` | `children` | `COUNT(*)` where `current_risk_level = 'medium'` |
| `HEALTHY STATUS` | `2,40,000` | `children` | `COUNT(*)` where `current_risk_level = 'normal'` or IS NULL |
| `Risk Pie Chart` | hardcoded 4 values | Same counts above | Aggregated into pie segments |
| `Risk by District Bars` | `DISTRICT_MOCK_DATA.risk` | `children` grouped by district | Group by `current_risk_level` per district |
| `SAM Rate / Backlog` | `10%`, `128` | Computed | `high / total * 100`, flags with `priority=critical AND status='raised'` |
| `Domain Concern Heatmap` | `(idx + id) % 10` (fake) | `flags.category` | Group by `category` × district, count per cell |

### Trends Tab

| Placeholder | Current Value | Real Data Source |
|-------------|--------------|------------------|
| `Multi-District Trend` | `generateLineData()` (random) | `children.last_screening_date` grouped by month × district |
| `Annotation "New Diagnostic Policy"` | Hardcoded string | Keep as static UI element (policy annotation) |

### Conditions Tab

| Placeholder | Current Value | Real Data Source |
|-------------|--------------|------------------|
| `CONDITION_STATS` (7 items) | hardcoded counts | `flags.category` grouped, COUNT per category |
| `Condition by District Heatmap` | `(i + id) % 5` (fake) | `flags.category` × district cross-tab |
| `Condition Trend Line` | `generateTrendLineData()` (random) | `flags` grouped by `category` + month for last 6 months |
| `Prevalence Alert` | Hardcoded string about Guntur | Dynamically find district with highest deviation from state avg |

---

## Tasks

- [ ] Task 1: Create `src/app/api/commissioner/screening/route.ts` with these endpoints:
  - `type=coverage-kpis` → total, screened, unscreened, rate
  - `type=district-coverage` → per-district coverage (name, total, screened, coverage%)
  - `type=age-bands` → screened/unscreened by age band
  - `type=coverage-trends` → monthly coverage by district (last 12 months)
  - `type=risk-kpis` → counts by risk level + critical flags count
  - `type=risk-by-district` → risk breakdown per district
  - `type=conditions` → flag category counts + rates
  - `type=condition-heatmap` → category × district cross-tab
  - `type=condition-trends` → monthly flag counts by category (last 6 months)
  → Verify: each endpoint returns JSON, `curl localhost:3000/api/commissioner/screening?type=coverage-kpis`

- [ ] Task 2: Update `ScreeningRiskView.tsx` — add `useEffect` + `useState` to fetch from `/api/commissioner/screening?type=...` per tab, replacing all hardcoded arrays and `DISTRICT_MOCK_DATA` imports
  → Verify: page loads with real data, no console errors

- [ ] Task 3: Add loading/empty states for each tab so the UI doesn't break when data is loading or missing
  → Verify: see skeleton placeholders before data arrives

## Done When
- [ ] All 4 tabs show real DB data instead of mock constants
- [ ] Data is scoped to the commissioner's assigned state
- [ ] No `DISTRICT_MOCK_DATA`, `CONDITION_STATS`, or `AGE_BAND_STATS` imports remain in `ScreeningRiskView.tsx`
