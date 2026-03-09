# Commissioner Referrals Page — Dynamic Data Plan

## Goal
Replace all placeholder data in `/commissioner/referrals` with live Supabase data, scoped to the commissioner's state.

## Architecture
**New API route:** `GET /api/commissioner/referrals?type=<endpoint>`  
**File:** `src/app/api/commissioner/referrals/route.ts`

> **⚠️ Note:** `referrals` table currently has **0 rows** and `referral_directory` may also be empty. The API queries are wired to the real tables, but the frontend will show graceful empty states until data is populated.

---

## Placeholder → Real Data Mapping

### KPIs (6 cards — all hardcoded)

| Placeholder | Current Value | Real Data Source | Query Logic |
|-------------|--------------|------------------|-------------|
| `TOTAL REFERRALS` | `42,400` | `referrals` | `COUNT(*)` where child in state AWCs |
| `ACTIVE (PENDING)` | `4,780` | `referrals` | `COUNT(*)` where `status IN ('created','informed')` |
| `SCHEDULED` | `2,120` | `referrals` | `COUNT(*)` where `status = 'scheduled'` |
| `COMPLETED` | `34,200` | `referrals` | `COUNT(*)` where `status = 'completed'` |
| `OVERDUE` | `1,300` | `referrals` | `COUNT(*)` where `follow_up_date < NOW()` and `status NOT IN ('completed','cancelled')` |
| `AVG WAIT TIME` | `11 days` | `referrals` | Avg diff between `created_at` and `completed_at` for completed referrals |

### Pipeline Funnel (4 steps — hardcoded)

| Step | Current Value | Real Data Source |
|------|--------------|------------------|
| `GENERATED` | `42,400` | Total referrals count |
| `SENT` | `38,160` | `status NOT IN ('created')` |
| `SCHEDULED` | `31,280` | `status IN ('scheduled','visited','results_received','completed')` |
| `COMPLETED` | `22,472` | `status = 'completed'` |

### Charts

| Placeholder | Current Source | Real Data Source | Query Logic |
|-------------|---------------|------------------|-------------|
| Specialist Type Bars | Inline hardcoded (6 types) | `referrals.referral_type` | Group by `referral_type`, count by status |
| District Status Bars | `DISTRICT_MOCK_DATA` | `referrals` + districts | Group by district, count active vs completed |
| Referral Intake Trend | `REFERRAL_MONTHLY_TREND` | `referrals.created_at` | Monthly generated vs completed for last 12 months |

### Facility Grid

| Placeholder | Current Source | Real Data Source | Query Logic |
|-------------|---------------|------------------|-------------|
| Facility Status Grid | `FACILITY_GRID_DATA` (6 districts × 7 types) | `referral_directory` | Group by district × type, compute capacity from load |

### Overdue Table

| Placeholder | Current Source | Real Data Source | Query Logic |
|-------------|---------------|------------------|-------------|
| Overdue Referrals | `OVERDUE_REFERRALS` (5 items) | `referrals` join `children` | `follow_up_date < NOW()` AND `status NOT IN ('completed','cancelled')`, join child name + district |

---

## Tasks

- [ ] Task 1: Create `src/app/api/commissioner/referrals/route.ts` with endpoints:
  - `type=kpis` → 6 KPI counts + avg wait time
  - `type=pipeline` → funnel stages with counts and drop-off %
  - `type=by-specialist` → referral type breakdown (active/completed/overdue)
  - `type=by-district` → district-level active vs completed counts
  - `type=trends` → monthly generated vs completed for last 12 months
  - `type=facility-grid` → referral_directory grouped by district × type
  - `type=overdue` → overdue referrals with child name, district, type, days overdue
  → Verify: `tsc --noEmit` passes

- [ ] Task 2: Rewrite `ReferralHealthView.tsx` — fetch from API, remove all mock imports, add loading/empty states
  → Verify: page loads, no console errors

- [ ] Task 3: Update `BACKEND_API_DOCS_v4.1.md` with new referral endpoints

## Done When
- [ ] All sections show live data (or graceful empty states)
- [ ] No `REFERRAL_MONTHLY_TREND`, `FACILITY_GRID_DATA`, `OVERDUE_REFERRALS`, `DISTRICT_MOCK_DATA` imports remain
