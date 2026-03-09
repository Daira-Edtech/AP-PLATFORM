# District Workforce Drill-Down

## Goal
Click a district row in `/commissioner/workforce` → navigate to a district workforce detail page showing personnel roster, mandal-level breakdown, assignments, and activity data.

## Available DB Data per District

| Source | Fields |
|--------|--------|
| `profiles` (role=aww/supervisor/cdpo) | Name, phone, role, mandal_id, is_active, last_login_at |
| `awcs` → `mandals` → `districts` | Geographic hierarchy + AWC names |
| `questionnaire_sessions` (by conducted_by) | Training/activity per worker |
| `children` (by awc_id) | Child count per AWC for ratios |

## Architecture

**Route:** `/commissioner/workforce/[districtId]` 
**API:** `GET /api/commissioner/workforce/[districtId]?type=<endpoint>` 
**Component:** `DistrictWorkforceView.tsx`

### API Endpoints (4)

| Endpoint | Returns |
|----------|---------|
| `type=summary` | District name, total AWWs/supervisors/CDPOs, vacancy %, training compliance, avg child:AWW ratio |
| `type=personnel` | Full personnel list: name, role, phone, mandal, AWC, last login, session count (30d), child count |
| `type=mandal-breakdown` | Per-mandal: AWW count/target, supervisor, vacancy %, training %, child ratio |
| `type=activity` | Per-worker session frequency (last 30d) for activity chart |

### UI Sections

| Section | Content |
|---------|---------|
| **Header** | Back nav + district name + 6 KPIs (AWWs, Supervisors, CDPOs, Vacancy, Training, Ratio) |
| **Personnel Roster** | Filterable/searchable table with role, name, phone, location, last login, sessions, children |
| **Mandal Breakdown** | Table showing mandal-level metrics (like the state-level district table, but one level deeper) |

## Tasks

- [ ] Create `src/app/api/commissioner/workforce/[districtId]/route.ts` — 4 endpoints
- [ ] Create `src/components/commissioner/DistrictWorkforceView.tsx` — personnel roster + mandal breakdown
- [ ] Create `src/app/commissioner/workforce/[districtId]/page.tsx`
- [ ] Wire district row click in `WorkforceOverview.tsx` → `router.push`
- [ ] Verify TypeScript + update docs

## Done When
- [ ] Click district row → navigates to `/commissioner/workforce/[id]`
- [ ] Detail page shows live personnel data and mandal breakdown
