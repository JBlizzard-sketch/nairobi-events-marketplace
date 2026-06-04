# Nairobi Events Marketplace

[![CI](https://github.com/JBlizzard-sketch/nairobi-events-marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/JBlizzard-sketch/nairobi-events-marketplace/actions/workflows/ci.yml)

> **The structured vendor discovery and quoting platform for Nairobi's corporate and social events market.**

---

## The Problem

Planning a corporate event, product launch, wedding, or private party in Nairobi means juggling 15 separate WhatsApp threads with strangers who may or may not be legitimate, quote inconsistently, and ghost you without warning. There is no single place to describe your event and receive structured, comparable quotes from vetted vendors — caterers, MCs, florists, photographers, AV technicians, tent/furniture suppliers, event security.

**Every procurement manager at a Nairobi corporate has felt this pain. Every couple planning a wedding has felt it.**

---

## What We're Building

A platform where an event planner fills in a structured event brief — event type, date, location, guest count, budget range, services needed — and within **4 hours** receives **3 competing quotes** from vetted vendors in each required category.

### Core Value Proposition
- **Structured quotes** — compare vendors side by side on price, inclusions, and ratings
- **Vetted vendors** — portfolio, references, and business registration verified on sign-up
- **Escrow payments** — funds held until event completion, eliminating vendor fraud
- **AI budget optimisation** — smart vendor combinations that fit your brief and budget
- **Availability calendar** — instantly see which vendors are free on your date

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                 │
│              Hosted on Vercel                        │
└────────────────────┬────────────────────────────────┘
                     │ REST / WebSocket
┌────────────────────▼────────────────────────────────┐
│              Backend API (Express / Node)            │
│              Hosted on Railway                       │
├─────────────────────────────────────────────────────┤
│   PostgreSQL (Railway)  │  Background Jobs (BullMQ)  │
│   Drizzle ORM           │  Quote routing / Notifs    │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, Tailwind CSS, shadcn/ui |
| Backend API | Express 5, Node.js 24, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4, drizzle-zod |
| API Contract | OpenAPI 3 → Orval codegen (React Query hooks) |
| Background Jobs | BullMQ + Redis |
| Auth | Clerk (multi-role: planner, vendor, admin) |
| Payments | Stripe (escrow flow) |
| Storage | S3-compatible object storage (vendor portfolios) |
| Monorepo | pnpm workspaces |
| CI/CD | GitHub Actions → Vercel + Railway |
| Containerisation | Docker-ready (Railway auto-detects) |

---

## Project Structure

```
nairobi-events-marketplace/
├── artifacts/
│   ├── api-server/          # Express API backend
│   └── web/                 # Next.js / React frontend (WIP)
├── lib/
│   ├── api-spec/            # OpenAPI spec (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod schemas
│   └── db/                  # Drizzle schema + migrations
├── scripts/                 # Utility scripts
├── .github/
│   └── workflows/           # CI/CD pipelines
├── pnpm-workspace.yaml
└── README.md
```

---

## Development Phases

### Phase 1 — Foundation & Auth ✅ (current)
- Monorepo scaffold (pnpm workspaces, TypeScript, Express, Drizzle)
- OpenAPI spec skeleton
- GitHub repo + CI pipeline

### Phase 2 — Core Data Models
- Users (planners, vendors, admins), Events, Services, Quotes
- Database schema + migrations
- Seed data for local development

### Phase 3 — Event Brief Submission Flow
- Multi-step brief form (type → date → location → guest count → budget → services)
- Under-5-minute submission target
- Draft saving

### Phase 4 — Vendor Directory & Profiles
- Vendor registration with portfolio upload
- Admin vetting queue
- Public profile pages with ratings

### Phase 5 — Quote Request Routing
- Background job: match brief → eligible vendors per service category
- Vendor notification (email + in-app)
- 4-hour response window enforcement

### Phase 6 — Quote Submission (Vendor Side)
- Vendor quote composer (line items, inclusions, terms)
- Quote preview before submission
- Quote versioning / revision requests

### Phase 7 — Quote Comparison Interface
- Side-by-side comparison table (price, inclusions, rating, availability)
- Shortlist / reject workflow
- Request clarification from vendor

### Phase 8 — Booking & Escrow Payments
- Stripe integration with escrow hold
- Booking confirmation flow
- Contract generation (PDF)

### Phase 9 — Availability Calendar
- Vendor-managed availability blocks
- Real-time availability check on brief submission
- "Who's free on my date" instant filter

### Phase 10 — Vendor Rating & Suspension System
- Post-event automated report card sent to planner
- Rating submission flow
- Auto-suspension thresholds (low ratings, no-shows)

### Phase 11 — Corporate Dashboard
- Multi-event management
- Budget tracking across events
- Vendor relationship management
- PO and invoicing compatibility

### Phase 12 — Planning Timeline Tool
- Recommended booking sequence by vendor type
- Deadline reminders per vendor category
- Event countdown view

### Phase 13 — Emergency Vendor Feature
- "I need a [caterer] in 48 hours" flow
- Premium urgent-response vendor tier
- Surge pricing transparency

### Phase 14 — AI Budget Optimisation
- AI suggests vendor combos within budget
- Trade-off explanations (premium vs budget options)
- Re-optimise on budget change

### Phase 15 — Post-Event Automation
- Automated report card emails (planner + vendor)
- Payment release trigger (event date + 24h)
- Review prompts

### Phase 16 — Admin Operations Panel
- Vendor vetting queue
- Dispute resolution
- Commission tracking and payout management
- Platform analytics

### Phase 17 — Notifications & Comms Layer
- Email (Resend/SendGrid) — quotes, reminders, reports
- SMS (Africa's Talking) — Kenya-local reach
- In-app notification centre

### Phase 18 — Mobile-Responsive & PWA
- Full mobile optimisation
- Offline brief drafting (PWA)
- Push notifications

### Phase 19 — White-Label Version
- Multi-tenant architecture
- Custom branding per tenant
- Tenant-scoped vendor network

### Phase 20 — Scale & Observability
- Docker compose for local multi-service dev
- Railway deployment configs
- Sentry error tracking
- Prometheus + Grafana metrics
- Load testing baseline

---

## Getting Started (Development)

### Prerequisites
- Node.js 24+
- pnpm 9+
- PostgreSQL (or Railway dev DB)

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Fill in DATABASE_URL, CLERK keys, STRIPE keys, etc.

# Push database schema
pnpm --filter @workspace/db run push

# Regenerate API hooks (after OpenAPI spec changes)
pnpm --filter @workspace/api-spec run codegen

# Start API server
pnpm --filter @workspace/api-server run dev
```

### Key Commands

```bash
pnpm run typecheck              # Full TypeScript check across all packages
pnpm run build                  # Typecheck + build all packages
pnpm --filter @workspace/api-spec run codegen   # Regenerate hooks/schemas
pnpm --filter @workspace/db run push            # Push DB schema changes (dev)
pnpm --filter @workspace/api-server run dev     # Run API server
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SESSION_SECRET` | Express session secret | ✅ |
| `CLERK_SECRET_KEY` | Clerk auth backend key | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe payments | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook validation | ✅ |
| `REDIS_URL` | BullMQ job queue | ✅ (Phase 5+) |
| `RESEND_API_KEY` | Transactional email | ✅ (Phase 17+) |
| `AFRICAS_TALKING_KEY` | SMS (Kenya) | Phase 17+ |

---

## Contributing

This project uses a contract-first API workflow:

1. Edit `lib/api-spec/openapi.yaml`
2. Run codegen: `pnpm --filter @workspace/api-spec run codegen`
3. Implement backend routes in `artifacts/api-server/src/routes/`
4. Frontend hooks are auto-generated in `lib/api-client-react/src/generated/`

Branch naming: `phase/<number>-<short-description>` (e.g. `phase/3-brief-submission`)

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

*Built for the Nairobi market. Expanding across East Africa.*
