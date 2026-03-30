# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Paper Maps** by summar studios — *The anti-Google-Maps.*

Paper Maps is a beautifully curated tourist map platform for Indian cities. It lets travelers experience cities through hand-picked, opinionated maps with a distinct editorial voice — the opposite of algorithm-driven, ad-cluttered navigation apps.

**Brand:** summar studios (lowercase intentional) — a small creative studio making beautifully designed, opinionated travel experiences.

**Core concept:**
- Each city gets its own curated map with a unique visual identity (colors, fonts, map style)
- POIs are hand-picked and classified by human curators (not user reviews)
- AI assists with enrichment (descriptions, tips, season) but humans approve everything before publish
- Mobile-first public explore pages; admin panel for curation

**Key Features:**
- Curated city maps with hand-picked Points of Interest (POIs)
- Per-city theme system (custom colors, fonts, map tile styles)
- MapLibre GL-powered interactive maps
- Itineraries and Collections for guided exploration
- AI-assisted POI enrichment (via Anthropic Claude)
- Google Places integration for POI discovery
- Sync endpoint for offline/mobile use
- JWT authentication for the admin/curator dashboard

---

## Repository Structure

```
papermaps/
├── backend/          # Fastify API server (TypeScript + Prisma + PostgreSQL)
│   ├── src/
│   │   ├── index.ts          # Server entry + route registration
│   │   ├── config.ts         # Environment config with validation
│   │   ├── lib/              # Shared: prisma client, response helpers
│   │   ├── middleware/        # JWT auth middleware
│   │   └── modules/          # Feature modules (see below)
│   └── prisma/
│       ├── schema.prisma     # Database schema
│       └── seed.ts           # Admin user + initial data seed
└── website/          # Next.js 14 App Router frontend
    └── app/
        ├── (main)/           # Public marketing / landing pages
        ├── (admin-area)/     # Admin panel (curator dashboard)
        ├── dashboard/        # Curator dashboard
        ├── explore/          # Public city explore pages
        └── api/              # Next.js API routes (if any)
```

---

## Backend Modules

All modules live in `backend/src/modules/` and follow the routes + service pattern:
- `{module}.routes.ts` — Fastify route handlers with Zod validation
- `{module}.service.ts` — Business logic using Prisma client

### Core Content Modules

| Module | Routes prefix | Purpose |
|--------|--------------|---------|
| `cities` | `/api/v1/cities` | City CRUD, status management (DRAFT/PUBLISHED/ARCHIVED) |
| `themes` | `/api/v1/cities/:cityId/theme` | Per-city visual theme (colors, fonts, map style JSON) |
| `categories` | `/api/v1/categories`, `/api/v1/cities/:cityId/categories` | POI categories (global + city-specific) |
| `pois` | `/api/v1/cities/:cityId/pois`, `/api/v1/pois/:id` | Points of Interest CRUD + status workflow |
| `poi-photos` | `/api/v1/pois/:poiId/photos`, `/api/v1/photos/:id` | POI photo management |
| `itineraries` | `/api/v1/cities/:cityId/itineraries`, `/api/v1/itineraries/:id` | Guided day/half-day itineraries with ordered stops |
| `collections` | `/api/v1/cities/:cityId/collections`, `/api/v1/collections/:id` | Curated POI collections (e.g., "Best coffee shops") |
| `tags` | `/api/v1/tags` | Global tag taxonomy for POIs |

### Discovery & AI Modules

| Module | Routes prefix | Purpose |
|--------|--------------|---------|
| `discovery` | `/api/v1/discovery-jobs`, `/api/v1/cities/:cityId/discover` | DiscoveryJob lifecycle management (create, track status, counts) |
| `places` | `/api/v1/places` | Google Places API search + place detail fetching; falls back to mock data when `GOOGLE_PLACES_API_KEY` is not set |
| `ai/enrichment` | `/api/v1/pois/:id/enrich`, `/api/v1/cities/:cityId/enrich-batch` | Claude-powered POI enrichment (descriptions, tips, best time, tags) — only fills empty fields, never overwrites human edits |
| `sync` | `/api/v1/cities/:slug/sync` | Returns full city payload (POIs, categories, themes, itineraries, collections) for offline/mobile use with ETag caching |

### Platform Modules

| Module | Routes prefix | Purpose |
|--------|--------------|---------|
| `auth` | `/api/v1/auth` | JWT login + register; `POST /auth/login`, `GET /auth/me` |
| `dashboard` | `/api/v1/dashboard` | Curator stats (POI counts by status, recent activity) |
| `admin` | `/api/v1/{ADMIN_URL_PREFIX}` | User management, analytics (obscure URL for security) |
| `audit` | `/api/v1/{ADMIN_URL_PREFIX}/audit-logs` | Action logging for compliance |

---

## Database Schema

Key models in `backend/prisma/schema.prisma`:

### Content Models

**`City`** — Core entity. Has `slug`, `centerLat/Lng`, `defaultZoom`, bounding box, `status` (DRAFT/PUBLISHED/ARCHIVED), `sortOrder`.

**`CityTheme`** — 1:1 with City. Stores `colorPrimary/Secondary/Accent/Background/Text`, font families/URLs, `logoUrl`, `emblemUrl`, `mapStyleJson` (full MapLibre style JSON), `iconPack`.

**`POI`** — Points of Interest. References `City` + `Category`. Has `latitude/longitude`, `googlePlaceId` (unique), rich content fields (`shortDescription`, `longDescription`, `localTip`), amenity booleans (`wheelchairAccessible`, `petFriendly`, etc.), `status` (AI_SUGGESTED → UNDER_REVIEW → APPROVED → PUBLISHED → ARCHIVED), `priority` (MUST_VISIT/RECOMMENDED/HIDDEN_GEM/OPTIONAL), `qualityScore`.

**`Category`** — Can be global (`isGlobal: true`) or city-specific. Has `icon`, `color`, `emoji`, `sortOrder`.

**`Tag`** — Global tag taxonomy. Many-to-many with POIs via `TagsOnPOIs` junction.

**`POIPhoto`** — Photos for a POI. Has `isPrimary`, `sortOrder`, `source`.

**`Itinerary`** — Has `duration`, `difficulty`, `estimatedBudget`, ordered `ItineraryStop[]` (each stop links to a POI with `timeOfDay`, `duration`, `transportToNext`).

**`Collection`** — Curated POI list. Has `CollectionItem[]` with `order` + `note`.

**`Media`** — General media uploads (IMAGE/VIDEO/DOCUMENT), linked to city and uploader.

### Discovery Models

**`DiscoveryJob`** — Tracks a POI discovery run. Has `cityId`, `categorySlug`, `searchQuery`, `source` (default: `google_places`), `status` (PENDING/RUNNING/COMPLETED/FAILED/CANCELLED), counts (`candidatesFound`, `approved`, `rejected`, `duplicatesSkipped`), `startedAt/completedAt`.

### Platform Models

**`User`** — `role` (ADMIN/CURATOR/VIEWER). Relations to curated POIs, itineraries, collections, discovery jobs.

**`AuditLog`** — Records all admin/curator actions with `action`, `resource`, `resourceId`, `details`, `ipAddress`, `success`.

**`Setting`** — Key-value store for runtime config.

---

## Development Commands

### Backend (in `backend/`)
```bash
npm run dev              # Start dev server with hot reload (tsx watch, port 3001)
npm run build            # Build for production (prisma generate + tsc)
npm run start            # Run production build

# Database
npm run db:push          # Push schema changes (development, no migration file)
npm run db:migrate       # Create + apply migration (development)
npm run db:migrate:deploy # Apply migrations in production
npm run db:seed          # Seed admin user + initial categories
npm run db:studio        # Open Prisma Studio GUI

# Testing
npm test                 # Run Vitest once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

### Frontend (in `website/`)
```bash
npm run dev     # Start dev server (port 3000)
npm run build   # Production build
npm run lint    # Run ESLint
```

### Local Setup
```bash
createdb papermaps          # or whatever DB name you configure
cd backend && npm run db:push && npm run db:seed
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
# Required
DATABASE_URL=postgresql://user@localhost:5432/papermaps
JWT_SECRET=<random-string>
FRONTEND_URL=http://localhost:3000

# Optional — features degrade gracefully without these
ANTHROPIC_API_KEY=sk-ant-...        # AI enrichment (enrichment.service.ts)
GOOGLE_PLACES_API_KEY=...           # Places search (falls back to mock data)

# Admin security
ADMIN_URL_PREFIX=admin-secret-prefix  # Obscure URL for admin routes

# Server
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# CORS (production)
CORS_ORIGINS=https://papermaps.in,https://mysore.papermaps.in
```

### Frontend (`website/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_ADMIN_PREFIX=admin-secret-prefix  # Must match backend ADMIN_URL_PREFIX
```

---

## Architecture Patterns

### Module Pattern

Every module has exactly two files:
```
modules/cities/
  cities.routes.ts   # Fastify routes + Zod schemas (no business logic)
  cities.service.ts  # Prisma queries + business logic (no HTTP)
```

### Authentication

JWT-based auth via `@fastify/jwt`. The `fastify.authenticate` decorator is registered globally and used as a `preHandler` hook on protected routes.

```typescript
// Protected route example
fastify.addHook('preHandler', fastify.authenticate);

// Get user from request
const user = (request as any).user; // { userId, email, role }
```

### POI Status Workflow

```
AI_SUGGESTED → UNDER_REVIEW → APPROVED → PUBLISHED → ARCHIVED
```

- `AI_SUGGESTED`: Created by discovery pipeline, needs human review
- `UNDER_REVIEW`: Curator is reviewing
- `APPROVED`: Curator approved, ready to publish
- `PUBLISHED`: Live on public map
- `ARCHIVED`: Removed from map (soft delete)

### Discovery Pipeline (Current State)

⚠️ **Important:** The discovery pipeline is partially implemented.

- `POST /cities/:cityId/discover` — Creates a `DiscoveryJob` record with `PENDING` status
- The route only creates the DB record. **There is no background worker** that actually runs the discovery against Google Places. The job remains PENDING indefinitely.
- `discovery.service.ts` has full CRUD for jobs but no `runJob()` or worker implementation
- Actual Places search logic exists in `places.service.ts` but is not wired into the discovery flow

### AI Enrichment (Implemented)

`enrichment.service.ts` — fully functional:
- Calls Anthropic Claude (claude-sonnet) to generate descriptions, tips, best time, tags, priority
- **Only fills empty fields** — never overwrites existing human-curated content
- `enrichPOI(poiId)` — enriches a single POI
- `enrichBatch(cityId)` — enriches all `AI_SUGGESTED` POIs in a city sequentially
- Requires `ANTHROPIC_API_KEY` in env; throws clearly if missing

### Places Search (Implemented with Mock Fallback)

`places.service.ts`:
- `searchPlaces(query, bounds)` — Google Places Text Search (New API)
- `getPlaceDetails(placeId)` — Full place details
- Falls back to `MOCK_PLACES` data when `GOOGLE_PLACES_API_KEY` is not configured
- `formatPlaceForPOI(place)` — converts Google Place to POI-ready shape

### Sync Endpoint

`GET /cities/:slug/sync` — returns the full city payload for offline/mobile:
- City + theme
- All categories (global + city-specific)
- All published POIs with photos + tags
- All published itineraries with stops
- All published collections with items
- Uses ETag for cache validation

### Admin Security

Admin routes use an obscure URL prefix instead of `/admin` (security through obscurity + proper auth):
- Backend: `/api/v1/{ADMIN_URL_PREFIX}/...`
- Both backend and frontend must use the same prefix
- Invalid prefixes return 404 (not 403) to prevent enumeration

---

## Adding a New Module

1. Create `backend/src/modules/{name}/`
2. Add `{name}.service.ts` — Prisma + business logic
3. Add `{name}.routes.ts` — Fastify routes + Zod validation
4. Import and register in `backend/src/index.ts`:
   ```typescript
   import { myRoutes } from './modules/my/my.routes.js';
   await fastify.register(myRoutes, { prefix: '/api/v1/my' });
   ```
5. Add any new Prisma models to `schema.prisma`, then run `npm run db:migrate`

---

## Deployment

**Platform:** Railway

- Backend: Fastify service on Railway
- Database: PostgreSQL on Railway
- Frontend: Vercel or Railway static

**Production checklist:**
- Set all required env vars (DATABASE_URL, JWT_SECRET, FRONTEND_URL)
- Run `npm run db:migrate:deploy` on first deploy
- Run `npm run db:seed` to create admin user
- Set `ADMIN_URL_PREFIX` to a secret random string
- Configure `CORS_ORIGINS` with all frontend domains

**Default seed credentials:**
```
Email: admin@papermaps.in
Password: admin123
```
Change immediately after first login.

---

## Key Design Decisions

1. **No user accounts on public site** — Paper Maps is read-only for the public. Auth is only for curators/admins.
2. **Human curation is the product** — AI assists but curators approve. Never auto-publish AI suggestions.
3. **Per-city themes are first-class** — Each city gets unique branding, not just a color swap.
4. **Offline-first sync** — The `/sync` endpoint is designed for mobile apps and PWA offline use.
5. **Google Places as input, not output** — Places search is for discovering candidates; the curator edits and enriches before anything goes live.
