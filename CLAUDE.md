# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint check
npm run seed:admins  # Seed admin users (runs scripts/ via tsx)
```

No test framework is configured.

## Architecture

**Jiveesha ECD Platform** — a Next.js App Router application for managing Early Childhood Development programs across Andhra Pradesh. Multi-portal architecture with role-based dashboards backed by Supabase (PostgreSQL).

### Portals and Routing

Each role has a dedicated portal under its own route segment:

| Role(s) | Portal Route | Description |
|---|---|---|
| `system_admin`, `super_admin` | `/admin/*` | User/geography/system management |
| `commissioner` | `/commissioner/*` | State-level read-only analytics |
| `district_officer` | `/dpo/*` | District Program Officer |
| `cdpo` | `/cdpo/*` | Child Development Program Officer |

Root `/` redirects authenticated users to their role's dashboard. The role → route mapping lives in [src/lib/roles.ts](src/lib/roles.ts).

### Authentication & Authorization

Three layers protect routes:

1. **Middleware** ([src/middleware.ts](src/middleware.ts)) — Supabase SSR session check on every request; unauthenticated users redirected to `/login`.
2. **Layout-level role checks** — Each portal layout fetches the profile and redirects if role doesn't match.
3. **Database RLS** — 90+ Row-Level Security policies enforce data access at the Supabase layer.

### Supabase Clients

Three clients with different privilege levels in [src/lib/supabase/](src/lib/supabase/):

- **`server.ts`** — SSR client using cookies; use in Server Components, layouts, middleware.
- **`client.ts`** — Browser client (anon key); use in Client Components.
- **`admin.ts`** — Service role client (bypasses RLS); use only in Server Actions and API routes for privileged operations.

### Data Layer

No ORM — direct Supabase JS client (`.from().select()` etc.). Schema is in [jiveesha_unified_schema_v4.sql](jiveesha_unified_schema_v4.sql): 42 tables, 22 PL/pgSQL functions, 25 triggers, 4 pg_cron jobs. TypeScript types for all tables and 13 enums are in [src/lib/types/database.ts](src/lib/types/database.ts).

**Geographic hierarchy**: State → District → Mandal → Sector → Panchayat → AWC (Anganwadi Center). Assignment tables link users to geographic units.

### Server Actions vs API Routes

- **Server Actions** (`'use server'` files in [src/lib/actions/](src/lib/actions/)) — secure mutations, call `revalidatePath()` after writes. Use for most data mutations.
- **API Routes** ([src/app/api/](src/app/api/)) — used for bulk operations (e.g., `/api/admin/users/bulk` for CSV user creation) and commissioner-specific endpoints.

### Styling

Tailwind CSS v4 with custom CSS variables defined in [src/app/globals.css](src/app/globals.css). Theme tokens follow a naming pattern: `--color-primary-solid`, `--color-app-bg`, `--radius-card`, etc. No third-party component library — lucide-react for icons, recharts for data visualization.

### Path Alias

`@/*` maps to `./src/*` — use this for all internal imports.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
