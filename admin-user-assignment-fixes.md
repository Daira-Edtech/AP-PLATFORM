# Fix Admin User Management Errors

## Goal
Resolve the 500 Internal Server error when reassigning users, the schema cache error for `sectors` and `panchayats` on the Admin Users page, and the 400 Bad Request error when fetching the audit log on the User Detail page.

## Tasks
- [ ] Task 1: Fix `src/app/admin/users/page.tsx` 
  - Remove `sectors(name)` and `panchayats(name)` from the Supabase join query since `profiles` table does not have `sector_id` and `panchayat_id`.
  - Verify: "Management join error" warning related to relationships in the schema cache goes away.
- [ ] Task 2: Fix `src/app/admin/users/actions.ts`
  - In `reassignUser` and `bulkReassign` functions, stop adding `sector_id` and `panchayat_id` to the `updateData` object passed to `supabase.from('profiles').update()`.
  - The `audit_log` inserts across this entire file are using old schematic columns (`resource_type`, `resource_id`, `details`). Update all `audit_log` insert statements in `actions.ts` to map to the correct v4 schema columns: `table_name`, `record_id`, and `new_data`.
  - Verify: Reassigning a user works successfully without a 500 Internal Server Error.
- [ ] Task 3: Fix `src/components/admin/UserDetail.tsx`
  - Replace all queries referencing the `timestamp` column on `audit_log` to use `created_at`.
  - Adjust the iteration loops where `act.timestamp` is used to `act.created_at`.
  - Change UI bindings (like `formatTime(a.timestamp)`) to `a.created_at`.
  - Verify: The 400 Bad Request error for `audit_log` vanishes and the activity table populates.

## Done When
- [ ] Can successfully update a user's assignment from the admin portal without a 500 error.
- [ ] The browser console is free of the `Management join error` and `400 Bad Request` schema errors.
