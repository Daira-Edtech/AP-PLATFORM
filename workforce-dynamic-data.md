# Commissioner Workforce Page — Dynamic Data Plan

## Goal
Replace all placeholder data in `/commissioner/workforce` with live Supabase data, scoped to the commissioner's state.

## Architecture
**New API route:** `GET /api/commissioner/workforce?type=<endpoint>`  
**File:** `src/app/api/commissioner/workforce/route.ts`

> **⚠️ Note:** No `training` table exists in the v4 schema. Training compliance is approximated from `questionnaire_sessions` frequency (AWWs conducting regular screenings = "trained"). Activity data comes from `questionnaire_sessions.started_at`.

---

## Placeholder → Real Data Mapping

### KPIs (6 cards — all hardcoded)

| Placeholder | Current Value | Real Data Source | Query Logic |
|-------------|--------------|------------------|-------------|
| `TOTAL AWWS` | `8,500` | `profiles` | `COUNT(*)` where `role='aww'` and `state_id` match |
| `MANDAL SCREENERS` | `420` | `profiles` | `COUNT(*)` where `role='supervisor'` |
| `CDPOs / DPOs` | `81` | `profiles` | `COUNT(*)` where `role IN ('cdpo','district_officer')` |
| `POSITIONS FILLED` | `94%` | `profiles` + `awcs` | Active AWW profiles / total AWC count × 100 |
| `TRAINING COMPLIANCE` | `78%` | `questionnaire_sessions` | % of AWWs who conducted ≥1 session in last 30 days |
| `AVG AWW:CHILD` | `1:44` | `profiles` + `children` | Total active children / total AWWs |

### District Table (`WORKFORCE_DISTRICT_DATA`)

| Column | Real Data Source | Query Logic |
|--------|-----------------|-------------|
| `awwsFilled / awwsTarget` | `profiles` (role=aww, per district) / `awcs.count` per district | Profile count vs AWC count |
| `screenersFilled / screenersTarget` | `profiles` (role=supervisor) / mandal count | Profile count vs mandal count |
| `cdposCount` | `profiles` (role IN cdpo, district_officer) per district | Count per district |
| `vacancyRate` | Derived | `(1 - awwsFilled/awwsTarget) × 100` |
| `trainingCompliance` | `questionnaire_sessions` | % of district AWWs with ≥1 session in 30 days |
| `childToAwwRatio` | `children` / AWW count per district | Active children / AWW count |
| `complianceScore` | Composite | `(100 - vacancyRate) × 0.4 + trainingCompliance × 0.3 + (50 - max(0, ratio-40)) × 0.3` |

### Training Heatmap (`TRAINING_HEATMAP_DATA`)

| Placeholder | Real Data Source | Query Logic |
|-------------|-----------------|-------------|
| District × 6 months | `questionnaire_sessions.started_at` | Per district, per month: % of AWWs who conducted ≥1 session |

### Activity Grid (Math.random → real data)

| Placeholder | Real Data Source | Query Logic |
|-------------|-----------------|-------------|
| 84-cell grid | `questionnaire_sessions.started_at` | Daily session count for last 12 weeks → normalize to intensity |
| Peak Activity Day | `questionnaire_sessions.started_at` | Day-of-week with most sessions |
| Avg Sessions / AWW | `questionnaire_sessions` / AWW count | Total sessions last 7 days / active AWW count |

### Vacancy Risk Card (hardcoded)

| Placeholder | Current Value | Real Data Source | Query Logic |
|-------------|--------------|------------------|-------------|
| Open Positions | `510` | `awcs.count - aww profiles.count` | Gap between AWC slots and filled AWWs |
| Est. Coverage Loss | `12.4%` | Derived | Vacancy% × coverage factor |
| Kurnool/Guntur | Hardcoded | Top 2 districts by vacancy rate | Sort districts by vacancy, take top 2 |

---

## Tasks

- [ ] Task 1: Create `src/app/api/commissioner/workforce/route.ts` with endpoints:
  - `type=kpis` → 6 KPI values
  - `type=district-table` → per-district workforce table
  - `type=training-heatmap` → 6-month per-district training heatmap
  - `type=activity` → 12-week daily activity grid + peak day + avg sessions
  - `type=vacancy` → open positions, coverage loss, top 2 vacancy districts
  → Verify: `tsc --noEmit` passes

- [ ] Task 2: Rewrite `WorkforceOverview.tsx` — fetch from API, remove mock imports, add loading/empty states, functional search
  → Verify: page loads, no console errors

- [ ] Task 3: Update `BACKEND_API_DOCS_v4.1.md` with new workforce endpoints

## Done When
- [ ] All sections show live data (or graceful empty states)
- [ ] No `WORKFORCE_DISTRICT_DATA`, `TRAINING_HEATMAP_DATA` imports remain
- [ ] Activity grid uses real session data, not `Math.random()`
