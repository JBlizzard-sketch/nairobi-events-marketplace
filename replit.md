# Nairobi Events Marketplace

## Overview

Full production-grade event vendor discovery and quoting marketplace for the Nairobi corporate/social events market. Planners submit event briefs, receive 3 competing quotes from vetted vendors within 4 hours. Features: quote comparison, escrow payments, vendor vetting, availability calendar, AI budget optimization, admin panel.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 18 + Vite, Wouter (routing), TanStack Query v5, Tailwind CSS
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Build**: esbuild (CJS bundle for API server)

## Workspace Packages

| Package | Path | Purpose |
|---|---|---|
| `@workspace/api-server` | `artifacts/api-server` | Express 5 REST API, serves `/api` |
| `@workspace/web` | `artifacts/web` | React+Vite frontend, serves `/` |
| `@workspace/mockup-sandbox` | `artifacts/mockup-sandbox` | Canvas component preview (Vite) |
| `@workspace/api-spec` | `lib/api-spec` | OpenAPI 3.1 spec (source of truth) |
| `@workspace/api-client-react` | `lib/api-client-react` | Orval-generated React Query hooks |
| `@workspace/api-zod` | `lib/api-zod` | Orval-generated Zod schemas |
| `@workspace/db` | `lib/db` | Drizzle ORM schema + migrations |

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Database Schema (10 tables)

`users`, `vendor_profiles`, `events`, `quotes`, `quote_line_items`, `bookings`, `reviews`, `notifications`, `vendor_availability`, `admin_audit_log`

Key enums: `user_role` (planner|vendor|admin), `event_status`, `quote_status`, `booking_status`, `vendor_category` (9 types), `notification_type` (6 types)

## API Routes (30+ endpoints)

Grouped by domain in `artifacts/api-server/src/routes/`:
- **users.ts** — registration, profile CRUD
- **events.ts** — create/list/update/submit brief (planner flow)
- **quotes.ts** — submit/accept/decline quotes, platform fee 10%
- **vendors.ts** — profile CRUD, availability calendar, search+filter
- **bookings.ts** — create booking, mock Stripe payment intent
- **reviews.ts** — post and list vendor reviews
- **notifications.ts** — list and mark-read
- **admin.ts** — stats dashboard, vendor approval queue

Auth: simulated via `x-clerk-user-id` header (localStorage `userRole` in frontend).

## Frontend Pages (20+)

All wired in `artifacts/web/src/App.tsx` using Wouter:

**Landing / Auth**
- `/` — Landing page (hero, features, how it works)
- `/login` — Role picker (planner | vendor | admin)

**Planner**
- `/dashboard` — Stats + recent events
- `/events` — Events list
- `/events/new` — Multi-step event brief form
- `/events/:id` — Event detail with quote comparison table
- `/vendors` — Vendor directory with search/filter
- `/vendors/:id` — Vendor profile
- `/bookings` — Bookings list
- `/bookings/:id` — Booking detail
- `/notifications` — Notification centre

**Vendor**
- `/vendor/dashboard` — Stats + pending requests
- `/vendor/requests` — Quote requests + submit-quote modal
- `/vendor/profile` — Profile edit form
- `/vendor/availability` — Monthly availability calendar

**Admin**
- `/admin/dashboard` — Platform stats
- `/admin/vendors` — Vendor approval queue

## Important Patterns

- **Generated hook mutation calls**: `mutation.mutateAsync({ data: { ...body } })` or `mutation.mutateAsync({ pathParam: id, data: {...} })` depending on whether the endpoint has a path param.
- **`submitBrief` mutation**: takes `{ eventId: string }` only — no `data` field.
- **Date fields**: Drizzle schema uses `PgDateString` — always convert JS `Date` to `"YYYY-MM-DD"` string before DB insert/compare. See `events.ts` and `vendors.ts` for the `toDateStr` helper pattern.
- **SQL date comparisons**: Use `sql\`${col} >= ${str}\`` with string values, not Drizzle `gte()` (which rejects string for date columns).
- **Platform fee**: 10% hardcoded in `quotes.ts`.
- **Mock payments**: `bookings.ts` returns `pi_mock_{timestamp}` as Stripe payment intent.

## Build Status

- Frontend typecheck: CLEAN (0 errors)
- Backend typecheck: CLEAN (0 errors)
- All 3 workflows running: api-server (8080), web (22333), mockup-sandbox (8081)
- All proxied through shared reverse proxy on port 80

## Planned Phases (remaining)

- Phase 5: Real auth (Clerk or Replit Auth)
- Phase 6: AI budget optimization
- Phase 7: Escrow payment flow (Stripe)
- Phase 8: Email/SMS notifications
- Phase 9: Vendor vetting workflow
- Phase 10: Analytics & reporting
