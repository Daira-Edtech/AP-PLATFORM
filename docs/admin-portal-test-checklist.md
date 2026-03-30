# Admin Portal — Manual Test Checklist

Base URL: `http://localhost:3000/admin`
Login as: `system_admin` or `super_admin` role

---

## Sidebar Navigation
- [ ] CONTENT section visible between HIERARCHY and SYSTEM
- [ ] Questions Bank, Activity Library links present and navigate correctly
- [ ] Alerts link present in SYSTEM section
- [ ] Active link highlight animates correctly when switching pages

---

## Dashboard (`/admin/dashboard`)
- [ ] Sync queue count shows real number (0 if queue clear)
- [ ] Sync queue badge is amber when > 0, green when 0
- [ ] Recent Actions shows real audit log entries (not hardcoded)
- [ ] Page loads without console errors

---

## Audit Log (`/admin/audit-log`)
- [ ] Table loads with real entries from DB (or empty state)
- [ ] Search field filters by action/user in real time
- [ ] Action filter dropdown narrows results
- [ ] Date From / Date To filters work
- [ ] Pagination: "Prev" disabled on page 1; "Next" disabled on last page
- [ ] Page numbers with ellipsis render correctly for > 5 pages
- [ ] Export CSV downloads a file with current page data
- [ ] URL updates when filters change (shareable/bookmarkable)

---

## Settings (`/admin/settings`)
- [ ] Shows real logged-in user name and email (not "Arjun Mehta")
- [ ] Role badge shows correct role
- [ ] Last login timestamp is real
- [ ] Other Admins section lists real admin users (or empty state)
- [ ] Logout button works

---

## Questions Bank (`/admin/questions`)
- [ ] Page loads with real questions (or empty state)
- [ ] Domain summary cards show correct counts
- [ ] Click domain card → filters table to that domain
- [ ] Search box filters by English text
- [ ] Critical Only toggle shows only is_critical=true rows
- [ ] Add Question button opens right drawer
- [ ] Create: fill all required fields → Save → row appears in table
- [ ] Edit: click edit icon → drawer pre-filled → save → row updates
- [ ] Delete: click delete icon → confirmation modal → confirm → row removed
- [ ] Domain badges are color-coded consistently

---

## Alerts (`/admin/alerts`)
- [ ] Page loads (or empty state with Bell icon)
- [ ] Summary cards show unread counts by severity
- [ ] Click summary card → sets filter tab
- [ ] Filter tabs: All / Unread / Critical / Warning / Info all work
- [ ] Unread alert has blue dot; is full opacity
- [ ] Click unread card → marks as read (dot gone, card dims) without page reload
- [ ] Mark all read button clears all unread indicators
- [ ] Create Broadcast: opens modal → select severity → fill title + message → Send → alert appears
- [ ] "All" tab count = total alerts; unread tab count = unread only

---

## Activity Library (`/admin/activities`)
- [ ] Page loads without error
- [ ] Blue info banner visible at top
- [ ] If no data: Layers icon + "No recommendations yet" message
- [ ] If data exists: total count, AI generated count, easy difficulty count cards visible
- [ ] Domain distribution cards show percentages and counts
- [ ] Recent recommendations table shows up to 20 rows

---

## Role Permissions (`/admin/roles`)
- [ ] Permission grid loads with real saved data
- [ ] Toggle a cell → Save Changes button activates
- [ ] Save Changes → spinner → green banner "Permissions updated successfully." → auto-dismisses after 3s
- [ ] Save failure → red banner → auto-dismisses
- [ ] Reset to defaults (first click) → button turns red + shows "Confirm reset?"
- [ ] Second click within 3s → permissions reset, button reverts
- [ ] Wait 3s without confirming → button reverts on its own
- [ ] NO browser `alert()` or `confirm()` dialogs at any point

---

## Data Management (`/admin/data`)
- [ ] Last backup shows real timestamp or "No backup recorded"
- [ ] Create Manual Backup: progress bar animates to 100% → timestamp updates → persists on refresh
- [ ] Export: deselect some fields → count in button updates
- [ ] Export CSV: file downloads as `.csv`
- [ ] Export JSON: file downloads as `.json`
- [ ] Green "Export downloaded successfully." banner appears after download
- [ ] Sync queue count shown next to Clear Sync Queue button
- [ ] Clear Sync Queue → modal → type CLEAR + password → Confirm → green banner shows count removed
- [ ] Restore from backup → modal shows "managed via Supabase dashboard" message
- [ ] Purge Test Data → modal shows "not applicable" message
- [ ] Storage section shows info card (no fake numbers)

---

## System Health (`/admin/health`)
- [ ] Page loads without error
- [ ] If `system_health_checks` is empty: gray "No health check data" banner; all services show UNKNOWN
- [ ] If health check data exists: banner shows correct overall status
- [ ] Sync Queue KPI shows real pending count
- [ ] Sync Errors KPI shows real error count
- [ ] Audit Events (24h) shows real count
- [ ] Service table: shows check_type label, status dot color, response time (ms or —)
- [ ] Sync Queue Breakdown: "Queue clear" state if 0 pending; chart if pending items exist
- [ ] Sync Error Log: checkmark empty state if no errors; table with rows if errors exist
- [ ] Refresh button triggers data reload (spinner visible briefly)

---

## Notifications (`/admin/notifications`)
- [ ] Page loads with 10 default rules (or saved rules if previously toggled)
- [ ] Toggle a rule → spinner appears → green "Rule saved successfully." banner
- [ ] Refresh page → toggled state persists
- [ ] Toggle failure → red error banner

---

## Geographic Hierarchy (`/admin/geography`)
- [ ] Tree loads with real hierarchy data
- [ ] Click node → details panel opens on right
- [ ] Add child entity: missing name/code → red inline error (no browser alert)
- [ ] Create successfully → green toast top-right
- [ ] Edit entity → Save → green toast
- [ ] Delete button (first click) → turns red "Confirm?"
- [ ] Second click → deletes entity; tree refreshes
- [ ] Wait 3s → Delete button reverts without deleting
- [ ] Unassign user: first click → "Confirm?"; second click → user unassigned; green toast
- [ ] Import button → blue info toast

---

## AWC Management (`/admin/geography/awcs`)
- [ ] Table loads with real AWCs
- [ ] Search / filters work
- [ ] Add AWC: missing mandatory fields → red error above save button in drawer
- [ ] Create AWC → success → appears in table
- [ ] Edit AWC → save → row updates
- [ ] Save failure → red toast top-right

---

## Bulk Operations (`/admin/users/bulk`)

### Import Users tab
- [ ] Upload CSV → validation step shows rows with VALID/INVALID status
- [ ] Proceed to import → results step shows success/failed counts
- [ ] Import API error → red toast (no browser alert)

### Bulk Assign tab
- [ ] Select users → Assign button activates
- [ ] First click → button turns amber "Confirm assign N users?"
- [ ] Second click within 3s → assigns; green toast
- [ ] Wait 3s → button reverts without assigning

### Bulk Actions tab
- [ ] Select users + choose action → Apply button activates
- [ ] First click → amber "Confirm action?"
- [ ] Second click → executes; green toast
- [ ] Wait 3s → reverts

---

## General UX
- [ ] Zero `alert()` or `confirm()` dialogs anywhere in the admin portal
- [ ] All toasts auto-dismiss after ~3.5 seconds
- [ ] All two-click confirms auto-revert after 3 seconds if not confirmed
- [ ] TypeScript compiles with zero errors (`npm run build`)
