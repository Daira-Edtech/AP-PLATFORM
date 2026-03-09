# Child Detail View — Plan

## Goal
When clicking a child row in `/commissioner/children`, navigate to a dedicated detail page showing the child's full profile with live data.

## Current State
- `onChildSelect` in `page.tsx` is a **no-op** `() => {}`
- Existing `ChildDetail` in `HierarchyDrillDown.tsx` uses hardcoded `ChildData` props — not reusable for API-driven detail
- No `/commissioner/children/[id]` route exists

## Available DB Tables per Child

| Table | Key Data |
|-------|----------|
| `children` | Name, DOB, gender, guardian, AWC, risk level, photo |
| `prenatal_history` | Birth weight, gestational age, delivery type, APGAR, NICU |
| `growth_records` | Weight, height, MUAC, z-scores (WAZ/HAZ/WHZ), edema, per measurement date |
| `questionnaire_sessions` | Screening sessions: domain scores, risk level, AI narrative |
| `observations` | AWW field notes: category, concern level, sentiment, AI response |
| `flags` | Escalation flags: priority, status, category, resolution |
| `referrals` | Specialist referrals: type, urgency, status, outcome |

## Architecture

**New route page:** `/commissioner/children/[id]/page.tsx`  
**New API route:** `GET /api/commissioner/children/[id]?type=<endpoint>`  
**New component:** `ChildDetailView.tsx`

### API Endpoints

| Endpoint | Returns |
|----------|---------|
| `type=profile` | Demographics + prenatal history + latest growth record + AWC/mandal/district names |
| `type=growth` | All `growth_records` sorted by date (for growth chart) |
| `type=screenings` | All `questionnaire_sessions` with domain scores, risk, AI narrative |
| `type=observations` | All `observations` sorted by date |
| `type=flags` | All `flags` with status, priority, resolution |
| `type=referrals` | All `referrals` with type, urgency, status, outcome |

### UI Tabs (matching existing ChildDetail pattern)

| Tab | Content |
|-----|---------|
| **Overview** | Demographics, latest growth metrics (height/weight/MUAC), prenatal history summary, risk badge |
| **Growth** | Growth records table + trend chart (weight/height over time) |
| **Screening** | All screening sessions, domain scores, risk timeline |
| **Observations** | AWW field notes, categorized, with AI responses |
| **Flags** | Escalation flags with status badges, resolution notes |
| **Referrals** | Specialist referrals, status tracking, outcome |

## Tasks

- [ ] Task 1: Create `src/app/api/commissioner/children/[id]/route.ts` with 6 endpoints
- [ ] Task 2: Create `src/components/commissioner/ChildDetailView.tsx` with tabbed UI matching existing design language
- [ ] Task 3: Create `src/app/commissioner/children/[id]/page.tsx` route page
- [ ] Task 4: Update `ChildrenDirectory.tsx` — wire `onChildSelect` to navigate via `router.push`
- [ ] Task 5: Verify TypeScript + update docs

## Done When
- [ ] Click child row → navigates to `/commissioner/children/[childId]`
- [ ] Detail page loads with live data across all 6 tabs
- [ ] Back button returns to directory
