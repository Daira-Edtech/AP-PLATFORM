# Dynamic Settings Page

## Goal
Replace all placeholders in `/commissioner/settings` with live user data, functional actions, and persisted preferences.

## Identified Placeholders

| Placeholder | Current value | Replace with |
|-------------|---------------|-------------|
| Commissioner name/email/phone/avatar | Hardcoded `R. K. Lakshman` | Live from `profiles` table via Supabase auth |
| IP whitelist | Fake 3 IPs | Remove (not in schema, not relevant for MVP) |
| 2FA status | Hardcoded "Enabled" | Display only (Supabase manages auth) |
| Active sessions | "1 active device" | Live last login from `profiles.last_login_at` |
| Login history | Non-functional | Display last 5 logins (approximate from `profiles.login_count`) |
| Threshold sliders/inputs | Local state only | Keep local for now (no `settings` table in schema) |
| Notification toggles | Local state only | Keep local for now (no notification preferences table) |
| Sign Out button | Non-functional | Wire to Supabase `signOut()` + redirect to `/login` |
| Data sync info | "5,10,000 records" | Live count from `children` + `profiles` tables |
| Export CSV | Non-functional | Trigger CSV download of children data |

## Pragmatic Scope

Since there's **no `settings` or `preferences` table** in the schema, we focus on:
1. ✅ **Live profile data** — name, email, phone, role, avatar from Supabase auth + `profiles`
2. ✅ **Functional Sign Out** — `supabase.auth.signOut()` + redirect
3. ✅ **Live data stats** — record counts in Data Governance section
4. ✅ **Remove fake IPs** — replace with actual session info
5. ✅ **Keep thresholds/notifications as local state** — they look functional but don't persist (no table)

## Tasks

- [ ] Rewrite `SettingsView.tsx` to accept profile props and fetch live data
- [ ] Update `settings/page.tsx` to pass profile data (already available from layout)
- [ ] Wire Sign Out button to `supabase.auth.signOut()`  
- [ ] Add live record counts in Data Governance section via API
- [ ] Verify TypeScript + test page load

## Done When
- [ ] Profile card shows actual logged-in user's name/email/phone
- [ ] Sign Out button works and redirects to `/login`
- [ ] Data Governance shows real record counts
