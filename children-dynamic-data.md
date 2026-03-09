# Commissioner Children Directory — Dynamic Data Plan

## Goal
Replace all placeholder data in `/commissioner/children` with live paginated Supabase data, scoped to the commissioner's state.

## Architecture
**New API route:** `GET /api/commissioner/children?type=<endpoint>`  
**File:** `src/app/api/commissioner/children/route.ts`

> **Key Design:** Server-side pagination (50 per page) because children table can have 500K+ rows. Filters applied server-side.

---

## Placeholder → Real Data Mapping

### Subtitle & Stats

| Placeholder | Current Value | Real Data Source |
|-------------|--------------|------------------|
| Subtitle "5,10,000 children across 13 districts" | Hardcoded | `children` count + `districts` count |
| Screened % stat card | Derived from mock array | `children` where `last_screening_date IS NOT NULL` / total |
| High/Critical Risk % | Derived from mock array | `children` where `current_risk_level IN ('high','critical')` / total |
| Referred % | Derived from mock array | Children with ≥1 referral / total |
| "Page 1 of 10,200" | Hardcoded | Total count / page size |

### Filter Dropdowns (all hardcoded options)

| Filter | Current Options | Real Data Source |
|--------|----------------|------------------|
| District | 6 hardcoded names | `districts` in state |
| CDPO | 3 hardcoded names | `profiles` where `role='cdpo'` |
| Mandal | 3 hardcoded names | `mandals` in state districts |
| AWC | 3 hardcoded names | `awcs` in selected context |
| Risk Level | Low/Medium/High/Critical | Static (enum values) |
| Status | Screened/Unscreened/In Intervention | Static (derived) |
| Age Range | 0-1yr through 5-6yr | Static (computed from DOB) |

### Children Table (`DIRECTORY_CHILDREN` — 10 mock records)

| Column | Real Data Source | Query Logic |
|--------|-----------------|-------------|
| Name / ID | `children.name`, `children.id` | Direct |
| Age / Gender | `children.date_of_birth`, `children.gender` | Computed age from DOB |
| AWC / Mandal | `awcs.name`, `mandals.name` | Join via `children.awc_id` |
| CDPO / District | `profiles.name` (role=cdpo), `districts.name` | Join via geographic chain |
| Risk | `children.current_risk_level` | Direct |
| Flags | `flags` count per child | `COUNT(*)` from `flags` |
| Referrals | `referrals` count per child | `COUNT(*)` from `referrals` |
| Last Activity / Last Screened | `children.updated_at`, `children.last_screening_date` | Direct |

---

## Tasks

- [ ] Task 1: Create `src/app/api/commissioner/children/route.ts` with endpoints:
  - `type=summary` → total count, screened %, high-risk %, referred %, district count
  - `type=filters` → dynamic dropdown options (districts, CDPOs, mandals, AWCs)
  - `type=list&page=1&pageSize=50&search=&district=&risk=&status=&age=` → paginated children with all joins, total count for pagination
  → Verify: `tsc --noEmit` passes

- [ ] Task 2: Rewrite `ChildrenDirectory.tsx` — fetch from API, server-side pagination, dynamic filters, remove mock imports
  → Verify: page loads, filters work, pagination works

- [ ] Task 3: Update `BACKEND_API_DOCS_v4.1.md` with new children endpoints

## Done When
- [ ] All data is live (or graceful empty states)
- [ ] No `DIRECTORY_CHILDREN`, `DISTRICT_MOCK_DATA` imports remain
- [ ] Pagination is server-side with real page count
- [ ] Filter dropdowns populated from DB
