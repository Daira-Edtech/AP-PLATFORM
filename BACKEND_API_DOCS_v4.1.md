# Jiveesha Platform — Backend API Documentation v4.1

> **Last Updated:** 2026-03-08  
> **Schema Version:** jiveesha_unified_schema_v4

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication](#authentication)
3. [Commissioner API Routes](#commissioner-api-routes)
4. [Admin Server Actions](#admin-server-actions)
5. [Database Schema Reference](#database-schema-reference)

---

## Architecture Overview

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Next.js 14 (App Router) | Server & Client Components |
| **Backend** | Next.js API Routes + Server Actions | `src/app/api/` and `actions.ts` files |
| **Database** | Supabase (PostgreSQL) | RLS active, admin client bypasses via service-role key |
| **Auth** | Supabase Auth | Phone OTP + Email/Password |

**Client Types:**
- `createClient()` — browser-side, respects RLS (`@/lib/supabase/client`)
- `createClient()` — server-side with cookie-forwarded session (`@/lib/supabase/server`)
- `createAdminClient()` — service-role key, **bypasses RLS** (`@/lib/supabase/admin`)

---

## Authentication

| Method | Used By |
|--------|---------|
| Phone OTP | Field workers (AWW, Supervisors) |
| Email/Password | Admins, Commissioners, System Admins |

Login flow: Supabase Auth → `profiles` table lookup → role-based redirect.

---

## Commissioner API Routes

These routes use `createAdminClient()` (to bypass RLS) but scope all queries to the logged-in commissioner's **assigned state** via `createClient()` session lookup.

### `GET /api/commissioner/dashboard`

**File:** `src/app/api/commissioner/dashboard/route.ts`

| Query Param | Description |
|-------------|-------------|
| `type=kpis` | State-level KPIs (total children, screened, flagged, referred) |
| `type=risk-distribution` | Risk breakdown (normal, moderate, severe) |
| `type=alerts` | Recent alerts for the commissioner's state |
| `type=escalation-summary` | Escalation counts by status |
| `type=historical-kpis` | Trend data from `kpi_cache` filtered by `entity_id = state_id` |

**State Filtering:** Fetches user session → `profiles.state_id` → cascades to districts → mandals → AWCs → children → filters all queries.

---

### `GET /api/commissioner/districts`

**File:** `src/app/api/commissioner/districts/route.ts`

Returns all districts within the commissioner's state, enriched with:
- Mandal count, AWC count, child count per district
- Active flags and referrals per district
- DPO and CDPO profiles for each district

**State Filtering:** Same cascade methodology as dashboard.

---

### `GET /api/commissioner/screening`

**File:** `src/app/api/commissioner/screening/route.ts`

| Query Param | Description |
|-------------|-------------|
| `type=coverage-kpis` | Total children, screened, unscreened, coverage rate |
| `type=district-coverage` | Per-district coverage (name, total, screened, coverage%) |
| `type=age-bands` | Screened vs unscreened by age band (0-1yr through 5-6yr) |
| `type=coverage-trends` | Monthly coverage by district for last 12 months + state avg |
| `type=risk-kpis` | Counts by `current_risk_level` (high/medium/normal) + critical flags |
| `type=risk-by-district` | Risk breakdown (Low/Medium/High/Critical) per district |
| `type=conditions` | Flag category counts with rates per 1,000 children |
| `type=condition-heatmap` | Category × District cross-tab matrix for heatmap visualization |
| `type=condition-trends` | Monthly flag counts by category for last 6 months |

**Data Sources:** `children` table (risk levels, DOB, last_screening_date) and `flags` table (category, priority).  
**State Filtering:** Same cascade as dashboard (user session → state_id → districts → mandals → AWCs → children).

---

### `GET /api/commissioner/analytics`

**File:** `src/app/api/commissioner/analytics/route.ts`

| Query Param | Description |
|-------------|-------------|
| `type=impact-summary` | Headline numbers (risk children, referrals, interventions) + 4 KPIs (identification improvement, YoY growth, referral completion, avg time to intervention) |
| `type=longitudinal` | Quarterly registration volumes + high-risk rate per quarter |
| `type=pipeline` | Intervention funnel: Screened → Identified → Referred → Started → Completed → Follow-up (with drop-off %) |
| `type=cohort&quarter=Q1-25` | Cohort stats: size, retention, outcome distribution (pie chart data) for selected quarter |
| `type=before-after` | Live "after" metrics vs pre-programme ICDS baseline constants |

**Data Sources:** `children`, `flags`, `referrals`, `interventions` tables.  
**State Filtering:** Same cascade as dashboard.

---

### `GET /api/commissioner/referrals`

**File:** `src/app/api/commissioner/referrals/route.ts`

| Query Param | Description |
|-------------|-------------|
| `type=kpis` | 6 KPI metrics: total, active, scheduled, completed, overdue, avg wait time |
| `type=pipeline` | 4-stage funnel: Generated → Sent → Scheduled → Completed (with % and timing) |
| `type=by-specialist` | Referral type breakdown (active/completed/overdue per referral_type) |
| `type=by-district` | District-level active vs completed referral counts |
| `type=trends` | Monthly generated vs completed for last 12 months with completion rate |
| `type=facility-grid` | `referral_directory` grouped by district × facility type with capacity status |
| `type=overdue` | Top 50 overdue referrals with child name, district, type, days overdue |

**Data Sources:** `referrals`, `referral_directory`, `children` tables.  
**State Filtering:** Same cascade as dashboard.

---

### `GET /api/commissioner/workforce`

**File:** `src/app/api/commissioner/workforce/route.ts`

| Query Param | Description |
|-------------|-------------|
| `type=kpis` | 6 KPIs: total AWWs, supervisors, CDPOs, positions filled %, training compliance %, AWW:child ratio |
| `type=district-table` | Per-district headcount (AWWs/target, screeners/target, CDPOs), vacancy %, training %, child ratio, composite score |
| `type=training-heatmap` | 6-month per-district training compliance % (from `questionnaire_sessions` frequency) |
| `type=activity` | 84-day daily session intensity grid, peak activity day, avg sessions/AWW/week |
| `type=vacancy` | Open AWW positions, coverage loss estimate, top 2 highest-vacancy districts |

**Data Sources:** `profiles`, `questionnaire_sessions`, `children`, `awcs` tables.  
**Note:** No `training` table in schema — compliance derived from session activity.  
**State Filtering:** Same cascade as dashboard.

---

### `GET /api/commissioner/children`

**File:** `src/app/api/commissioner/children/route.ts`

| Query Param | Description |
|-------------|-------------|
| `type=summary` | Total children count, screened %, high-risk %, referred %, district count |
| `type=filters` | Dynamic dropdown options (districts, CDPOs, mandals, AWCs from DB) |
| `type=list` | **Server-side paginated** children (50/page) with search, district, risk, status, age filters |

**`list` additional params:** `page`, `pageSize`, `search`, `district`, `risk`, `status`, `age`  
**Returns:** Enriched children with AWC/mandal/district names, flag count, referral count, computed age, status.  
**Data Sources:** `children`, `flags`, `referrals`, `awcs`, `mandals`, `districts`, `profiles` tables.  
**State Filtering:** Same cascade as dashboard.

---

### `GET /api/commissioner/children/[id]`

**File:** `src/app/api/commissioner/children/[id]/route.ts`

| Query Param | Description |
|-------------|-------------|
| `type=profile` | Full demographics, prenatal history, latest growth, AWC/mandal/district names, flag/referral/screening counts |
| `type=growth` | All `growth_records` sorted by date (weight, height, MUAC, z-scores) |
| `type=screenings` | All `questionnaire_sessions` with domain scores, risk, AI narrative |
| `type=observations` | All AWW `observations` with category, concern level, AI response |
| `type=flags` | All `flags` with priority, status, resolution notes |
| `type=referrals` | All `referrals` with type, urgency, status, outcome |

**Data Sources:** `children`, `prenatal_history`, `growth_records`, `questionnaire_sessions`, `observations`, `flags`, `referrals` tables.

---

### `GET /api/commissioner/workforce/[districtId]`

**File:** `src/app/api/commissioner/workforce/[districtId]/route.ts`

| Query Param | Description |
|-------------|-------------|
| `type=summary` | District KPIs: AWWs, supervisors, CDPOs, vacancy %, training compliance, child:AWW ratio |
| `type=personnel` | Full personnel roster with role, phone, mandal, AWC, sessions (30d), child count. Supports `search` and `role` filter params |
| `type=mandal-breakdown` | Per-mandal: AWW filled/target, supervisors, vacancy %, training %, children, child ratio |
| `type=activity` | AWW activity distribution: active/inactive counts, high/med/low activity buckets |

**Data Sources:** `profiles`, `awcs`, `mandals`, `questionnaire_sessions`, `children` tables.

---

### `GET /api/commissioner/settings`

**File:** `src/app/api/commissioner/settings/route.ts`

| Query Param | Description |
|-------------|-------------|
| `type=profile` | Live user profile data joined with state, plus last login metadata |
| `type=data-stats` | Total counts for children, profiles (workers), AWCs, and sessions in the user's state |

**Data Sources:** `profiles`, `children`, `awcs`, `questionnaire_sessions` tables. Supabase Auth.

---

## Admin Server Actions

**File:** `src/app/admin/users/actions.ts`

All actions use `createAdminClient()` and write to `audit_log` using the **v4 schema**.

| Action | Function | Description |
|--------|----------|-------------|
| Role Update | `updateUserRole(userId, role)` | Updates `profiles.role`, logs to `audit_log` |
| Status Toggle | `updateUserStatus(userId, is_active)` | Activates/deactivates user |
| Delete User | `deleteUser(userId)` | Deletes auth user + profile |
| Force Logout | `forceLogout(userId)` | Terminates user session |
| Reassign | `reassignUser(userId, assignment)` | Updates geographic assignment on profile |
| Profile Edit | `updateProfile(userId, data)` | Updates name, phone, email |
| Create User | `createNewUser(data)` | Creates auth user + profile (with sector/panchayat fallback) |
| Bulk Reassign | `bulkReassign(userIds, assignment)` | Batch geographic reassignment |
| Bulk Status | `bulkUpdateStatus(userIds, is_active)` | Batch activate/deactivate |
| Bulk Delete | `bulkDeleteUsers(userIds)` | Batch deletion (auth + profiles) |

### `audit_log` Insert Format (v4)

```typescript
{
  user_id: string,        // UUID of the acting user
  action: string,         // e.g. 'role_update', 'reassignment'
  table_name: string,     // e.g. 'profiles', 'sessions'
  record_id: string,      // UUID of the affected record
  new_data: object,       // JSON payload with change details
  purpose: string         // e.g. 'Administrative action'
}
```

---

### Geography Server Actions

**File:** `src/app/admin/geography/actions.ts`

| Function | Description |
|----------|-------------|
| `getGeographicTree()` | Returns all states, districts, mandals, sectors, panchayats, AWCs |
| `getEntitiesByParent(type, parentId)` | Returns child entities for a given parent level |

---

## Database Schema Reference

### Core Tables

| Table | Primary Key | Key Columns |
|-------|-------------|-------------|
| `profiles` | `id` (FK → auth.users) | `name, phone, email, role, state_id, district_id, mandal_id, sector_id, panchayat_id, awc_id, is_active` |
| `states` | `id` | `name` |
| `districts` | `id` | `name, state_id` |
| `mandals` | `id` | `name, district_id` |
| `sectors` | `id` | `name, mandal_id` |
| `panchayats` | `id` | `name, sector_id` |
| `awcs` | `id` | `name, panchayat_id, sector_id` |
| `children` | `id` | `name, awc_id, ...anthropometric fields` |
| `screenings` | `id` | `child_id, screening_date, ...measurements` |
| `flags` | `id` | `child_id, flag_type, severity, status` |
| `referrals` | `id` | `child_id, referred_to, status` |
| `alerts` | `id` | `related_child_id, alert_type, severity, status` |
| `audit_log` | `id` | `user_id, action, table_name, record_id, old_data, new_data, ip_address, purpose, created_at` |
| `kpi_cache` | `id` | `entity_type, entity_id, metric_name, metric_value, period_start, period_end` |

### Geographic Hierarchy

```
State → District → Mandal → Sector → Panchayat → AWC → Children
```

### User Roles (enum `user_role`)

| Role | Level |
|------|-------|
| `aww` | Anganwadi Worker (AWC level) |
| `supervisor` | Mandal level |
| `cdpo` | District level |
| `district_officer` | District level |
| `commissioner` | State level |
| `system_admin` | Platform-wide |
| `super_admin` | Platform-wide (full access) |

### Known Schema Notes

- **PostgREST FK detection:** The `sectors` and `panchayats` foreign keys on `profiles` may not be auto-detected by PostgREST's schema cache for join queries. Manual resolution maps are used as fallback in `page.tsx`.
- **`audit_log` columns:** The v4 schema uses `table_name`, `record_id`, `new_data`, `created_at`. Earlier code may reference `resource_type`, `resource_id`, `details`, `timestamp` — these are **incorrect** and have been fixed.

---

## RLS Policy Notes

- RLS is enabled on most tables.
- Commissioner-scoped pages use **server-side API routes** with `createAdminClient()` to bypass RLS, then manually filter by `state_id`.
- Admin pages use `createAdminClient()` (service role) for all operations.
- Client components that need protected data should fetch from `/api/commissioner/*` routes rather than querying Supabase directly.
