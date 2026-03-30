# Admin Portal — Implementation Log

## Overview
Full admin portal build-out across 4 phases. All pages now use real Supabase data, no hardcoded values, no `alert()`/`confirm()` dialogs.

---

## Phase 1 — Fix Broken Pages

### Dashboard (`/admin/dashboard`)
- Fixed `sync_queue` count query: `{ count: syncQueueCount }` with `.eq('synced', false)`
- Fixed `audit_log` query: `order('created_at')` (was `order('timestamp')`), removed broken `log.user_role` reference
- SYSTEM_KPIS sync count now real; amber when > 0, green when clear

### Settings (`/admin/settings`)
- Rewrote as server component fetching real profile data
- Removed all hardcoded "Arjun Mehta" placeholder data
- Shows real name, email, role, last login from `profiles` table
- Lists other admin users from `profiles` WHERE role IN ('system_admin','super_admin')
- Logout handler uses `createClient` from browser client

### Audit Log (`/admin/audit-log`)
- Full rewrite: server-side filtering + pagination (PAGE_SIZE=50)
- URL param driven: `page`, `action`, `dateFrom`, `dateTo`, `search`
- Two-query admin name enrichment (audit_log → profiles by user_id)
- Client-side CSV export of current page
- Pagination with ellipsis for large ranges

---

## Phase 2 — Build Empty Stub Pages

### Sidebar (`src/components/admin/Sidebar.tsx`)
- Added **CONTENT** section between HIERARCHY and SYSTEM
  - Questions Bank → `/admin/questions` (HelpCircle icon)
  - Activity Library → `/admin/activities` (Lightbulb icon)
- Added Alerts → `/admin/alerts` (Flag icon) to SYSTEM section

### Questions Bank (`/admin/questions`)
- `actions.ts`: `getQuestions()`, `createQuestion()`, `updateQuestion()`, `deleteQuestion()`
- Filters: domain dropdown (GM/FM/LC/COG/SE), text search, is_critical toggle
- Client component with:
  - Clickable domain summary cards
  - Searchable/filterable table with edit/delete on row hover
  - Right slide-in drawer for create/edit
  - Delete confirmation modal
  - `useTransition` + `router.refresh()` for reloads

### Alerts (`/admin/alerts`)
- `actions.ts`: `getAlerts()`, `markAlertRead()`, `markAllRead()`, `createBroadcast()`
- Filters admin-targeted alerts: `role IN (system_admin, super_admin)` OR `alert_type IN (system, super_admin_broadcast)`
- Summary cards for unread Critical / Warning / Info counts
- Optimistic mark-as-read on card click
- Create Broadcast modal with severity selector
- Filter tabs: All / Unread / Critical / Warning / Info

### Activity Library (`/admin/activities`)
- Read-only server component (no `activities` table exists — uses `activity_recommendations`)
- Info banner explaining planned feature status
- Empty state when no recommendations exist
- When data exists: aggregate stats + domain distribution cards + recent 20 table

### Role Permissions (`/admin/roles`)
- Replaced `alert()` → inline green/red auto-dismiss banner (3s)
- Replaced `confirm()` on reset → two-click pattern: first click arms (button turns red + "Confirm reset?"), second executes, 3s timeout auto-reverts

---

## Phase 3 — Wire Real Data to Remaining Pages

### Data Management (`/admin/data`)
**New:** `src/app/admin/data/actions.ts`
- `getDataStats()` — sync queue pending count + last manual backup timestamp from `system_settings`
- `recordManualBackup()` — upserts timestamp to `system_settings.last_manual_backup_at`
- `clearSyncQueue()` — deletes all `sync_queue` rows WHERE synced=false, returns count
- `exportData(fields, format)` — fetches selected tables via admin client, returns CSV or JSON blob, logs to `data_export_requests`

**Changes to component:**
- Removed fake `BACKUP_HISTORY` array
- Backup timestamp now real (persisted in `system_settings`)
- Export button triggers real download
- Sync queue count shown next to Clear button; success banner shows items removed
- Storage section replaced with info card (requires DB RPC for real sizes)
- Fixed `startTransition` in setInterval bug (called in state updater — moved to interval callback)

### System Health (`/admin/health`)
**New:** `src/app/admin/health/actions.ts`
- `getHealthStats()` — reads `sync_queue` (pending count + breakdown by table + recent errors), `system_health_checks` (latest per check_type), `audit_log` count in last 24h

**Changes to component:**
- Replaced all mock data arrays (SYNC_QUEUE_DEPTH, API_LATENCY_DATA, DB_GROWTH_DATA, SERVICES, ERROR_LOG)
- Status banner derived from real health check statuses (healthy/degraded/down/unknown)
- Service table shows real response times and last check timestamp
- Sync queue breakdown chart uses real by-table counts
- Sync error log table (empty state when clean)
- Refresh button calls `router.refresh()`

### Notifications (`/admin/notifications`)
**New:** `src/app/admin/notifications/actions.ts`
- `getNotificationRules()` — reads from `system_settings.notification_rules`, falls back to defaults
- `saveNotificationRules()` — upserts to `system_settings`

**Changes to component:**
- Toggle any rule → auto-saves to DB immediately
- Spinner on toggle during save; green/red inline banner
- Rules persist across page refreshes

---

## Phase 4 — Replace alert()/confirm() Across All Components

### GeographyHierarchy (`src/components/admin/GeographyHierarchy.tsx`)
- `alert('Name and Code required')` → inline red validation message below form
- `alert('Created successfully')` → fixed-position green toast (top-right, 3.5s)
- `alert('Updated successfully')` → green toast
- `alert('Error...')` → red toast
- `confirm('Unassign user?')` → two-click on Unassign button ("Confirm?" state, 3s timeout)
- `confirm('Delete entity?')` → two-click on Delete button (turns red "Confirm?", 3s timeout)
- `alert('Bulk import...')` → blue info toast

### AWCManagement (`src/components/admin/AWCManagement.tsx`)
- `alert('fill mandatory fields')` → inline red error above save button in drawer
- `alert('Error: ...')` → red toast (top-right, 3.5s)

### BulkOps (`src/components/admin/BulkOps.tsx`)
- `alert(err.message)` on import fail → red toast
- `confirm('Reassign N users?')` → two-click on Assign button (turns amber "Confirm assign N users?", 3s timeout)
- `confirm('Perform action on N users?')` → two-click on Apply button (turns amber, 3s timeout)
- `alert('Action not implemented')` → red toast
- `alert('Operation successful')` → green toast
- `alert('Error: ...')` → red toast
- Removed `window.location.reload()` calls — replaced with state reset + toast

---

## Files Created / Modified

| File | Action |
|---|---|
| `src/app/admin/dashboard/page.tsx` | Fixed real data queries |
| `src/app/admin/settings/page.tsx` | Rewrote with real profile data |
| `src/components/admin/Settings.tsx` | Removed hardcoded data |
| `src/app/admin/audit-log/page.tsx` | Full rewrite with pagination + filters |
| `src/components/admin/AuditLog.tsx` | Full rewrite with URL-param filters |
| `src/components/admin/Sidebar.tsx` | Added CONTENT section + Alerts link |
| `src/app/admin/questions/actions.ts` | Created — CRUD server actions |
| `src/app/admin/questions/page.tsx` | Rewrote from stub |
| `src/components/admin/QuestionsManager.tsx` | Created — full CRUD client component |
| `src/app/admin/alerts/actions.ts` | Created — alert server actions |
| `src/app/admin/alerts/page.tsx` | Rewrote from stub |
| `src/components/admin/AlertsManager.tsx` | Created — alerts client component |
| `src/app/admin/activities/page.tsx` | Rewrote as read-only overview |
| `src/components/admin/RolePermissions.tsx` | UX fix — inline banners, two-click reset |
| `src/app/admin/data/actions.ts` | Created — export/backup/clear actions |
| `src/app/admin/data/page.tsx` | Rewrote with real stats |
| `src/components/admin/DataManagement.tsx` | Wired real data, fixed transition bug |
| `src/app/admin/health/actions.ts` | Created — health stats server action |
| `src/app/admin/health/page.tsx` | Rewrote with real data |
| `src/components/admin/SystemHealth.tsx` | Replaced all mock data with real props |
| `src/app/admin/notifications/actions.ts` | Created — notification rules persistence |
| `src/app/admin/notifications/page.tsx` | Rewrote with real rules |
| `src/components/admin/Notifications.tsx` | Wired save on toggle |
| `src/components/admin/GeographyHierarchy.tsx` | Phase 4 UX fixes |
| `src/components/admin/AWCManagement.tsx` | Phase 4 UX fixes |
| `src/components/admin/BulkOps.tsx` | Phase 4 UX fixes |
| `CLAUDE.md` | Created — codebase guide |
