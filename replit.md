# Nairobi Events Marketplace

## Overview

Full production-grade event vendor discovery and quoting marketplace for the Nairobi corporate/social events market. Planners submit event briefs, receive 3 competing quotes from vetted vendors within 4 hours. Features: quote comparison, escrow payments, vendor vetting, availability calendar, AI budget optimization, admin panel with dispute resolution and platform settings, contextual notification action links.

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

## API Routes (45+ endpoints)

Grouped by domain in `artifacts/api-server/src/routes/`:
- **users.ts** — registration, profile CRUD
- **events.ts** — create/list/update/submit brief (planner flow)
- **quotes.ts** — submit/accept/decline quotes, platform fee 10%
- **vendors.ts** — profile CRUD, availability calendar, search+filter
- **bookings.ts** — create booking, payment intent (mock/Stripe), confirm→in_escrow, release escrow, dispute; GET enriched with vendorBusinessName, eventTitle, eventDate, category, plannerName
- **reviews.ts** — post and list vendor reviews
- **notifications.ts** — list and mark-read
- **admin.ts** — stats, vendor approval queue, `GET /admin/events` (paginated, enriched with planner/quote/booking counts), `GET /admin/bookings` (paginated, enriched with vendor/event/planner context)

Auth: simulated via `x-clerk-user-id` header (localStorage `userRole` in frontend).

## Frontend Pages (25+)

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
- **Escrow payment flow** (Phase 7): 2-step flow — `POST /payment-intent` creates intent and records in `payments` table; `POST /confirm` advances booking → `in_escrow`; `POST /release` completes booking and marks payment released; `POST /dispute` flags booking as disputed. Mock payment intent (`pi_mock_{timestamp}`) used when no `STRIPE_SECRET_KEY` env var — swap with real Stripe trivially by setting the env var.

## Auth (Phase 5 — Complete)

Clerk auth is fully integrated (Replit-managed, `app_3DB4cCUF2LPNoR0IhF7HoGYK2IE`).

**Flow:**
1. Unauthenticated users see the landing page at `/`
2. Sign in via `/sign-in` (Clerk UI — email/password + Google SSO)
3. Sign up via `/sign-up` → redirects to `/role-select` after Clerk verification
4. Role select page calls `POST /api/users/sync` to create the DB user record with chosen role
5. Redirected to `/dashboard` (planner) or `/vendor/dashboard` (vendor)
6. Admin users created directly in DB

**Key files:**
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk proxy for OAuth callbacks
- `artifacts/api-server/src/app.ts` — `clerkMiddleware()` mounted before API routes
- `artifacts/web/src/hooks/use-auth.tsx` — uses `useUser()` + `useGetMe()` query for DB role
- `artifacts/web/src/pages/auth/role-select.tsx` — role selection after sign-up
- `artifacts/web/public/logo.svg` — branded amber N logo shown on Clerk sign-in/up pages

**Backend auth pattern (all routes):**
```typescript
const clerkId = getAuth(req)?.userId ?? undefined;
if (!clerkId) { res.status(401).json({ error: "unauthorized" }); return; }
```

**Clerk appearance:** shadcn theme, amber primary `hsl(35 90% 50%)`, Inter font, warm off-white background.

## Build Status

- Frontend typecheck: CLEAN (0 errors)
- Backend typecheck: CLEAN (0 errors)
- All 3 workflows running: api-server (8080), web (22333), mockup-sandbox (8081)
- All proxied through shared reverse proxy on port 80

## AI Budget Optimization (Phase 6 — Complete)

Uses Replit-managed OpenAI integration (no API key needed, billed to credits).

**Endpoint:** `POST /api/ai/budget-optimize`
- Requires Clerk auth
- Body: `{ eventType, guestCount, servicesNeeded, totalBudget?, city? }` (validated by Zod)
- Calls `gpt-5-mini` with a structured JSON prompt using current Nairobi market rates
- Returns: `{ suggestedMin, suggestedMax, currency, breakdown[], tips[] }`

**Frontend:** Step 3 (Services) of the event creation form shows an "AI Budget Advisor" panel:
- Appears once at least one service is selected
- "Get Estimate" button calls the endpoint and shows a per-service breakdown with KES amounts, % bars, and rationale
- "Apply to Budget" button sets the min/max budget fields and navigates back to step 2
- "Re-run" button available after first estimate (e.g., if services change)

**Key files:**
- `artifacts/api-server/src/routes/ai.ts` — AI route
- `lib/integrations-openai-ai-server/` — pre-configured OpenAI SDK client (Replit-managed)
- `artifacts/web/src/pages/planner/event-new.tsx` — event form with AI advisor panel

## Escrow Payment Flow (Phase 7 — Complete)

Full 2-step escrow payment system on the booking detail page.

**API endpoints (`artifacts/api-server/src/routes/bookings.ts`):**
- `POST /api/bookings/:id/payment-intent` — creates payment intent, inserts `payments` row (status: pending). Returns `{ paymentIntentId, clientSecret, amount, currency, isMock }`. Mock when no `STRIPE_SECRET_KEY` env var.
- `POST /api/bookings/:id/confirm` — accepts `{ paymentIntentId }`, advances booking → `in_escrow`, updates payment → `held_in_escrow`.
- `POST /api/bookings/:id/release` — advances booking → `completed`, payment → `released`. Only callable by planner who owns the booking.
- `POST /api/bookings/:id/dispute` — advances booking → `disputed`, stores reason in `cancellationReason`. Callable by planner or vendor.

**Frontend (`artifacts/web/src/pages/planner/booking-detail.tsx`):**
- Visual escrow tracker (step progress bar: Payment → Escrow Held → Released)
- M-Pesa / Card method selector with payment forms
- Animated confirm button with KES amount
- Release escrow with confirmation dialog
- Dispute button with reason textarea (min 10 chars) in confirmation dialog
- Completed state with leave-a-review prompt
- Disputed state with resolution notice

**Payments table:** Properly populated via `db.insert(payments)` in `/payment-intent`, updated in `/confirm` and `/release`.

**To enable real Stripe:** set `STRIPE_SECRET_KEY` (server) and `VITE_STRIPE_PUBLISHABLE_KEY` (frontend) env vars.

## Notifications System (Phase 8 — Complete)

Automatic in-app notifications + email transport fully wired across all business events.

**Service layer (`artifacts/api-server/src/services/`):**
- `notify.ts` — fire-and-forget helper: inserts a DB notification row + optionally sends email. Never blocks the calling route.
- `email.ts` — transport: logs to console (dev stub) when `SMTP_HOST` env var is absent; sends real email via nodemailer when configured. Env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

**Triggers wired into routes:**
| Event | Who notified | Type |
|---|---|---|
| Event brief submitted | Each matched vendor | `quote_requested` |
| Vendor submits quote | Planner | `quote_received` |
| Planner accepts quote | Vendor | `booking_confirmed` |
| Payment confirmed (in_escrow) | Vendor | `payment_received` |
| Escrow released | Vendor | `payment_released` |
| Dispute raised | Other party | `payment_received` |
| Review posted | Vendor | `review_reminder` |

**Frontend:**
- `NotificationBell` component — polls every 30 s for unread count; shows red badge. Available in sidebar for planners and vendors.
- Notifications page — redesigned with per-type icons and colours, relative timestamps (e.g. "5m ago", "2d ago"), and body field correctly read from DB.

## Planned Phases (remaining)

- Phase 9: Vendor vetting workflow
- Phase 10: Analytics & reporting
