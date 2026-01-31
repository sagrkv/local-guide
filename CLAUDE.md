# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Boko is a B2B lead generation SaaS platform that automates lead discovery through web scraping and manages leads through a sales pipeline. It consists of a Fastify backend with BullMQ job queues and a Next.js frontend with user dashboard.

**Key Features:**
- Map-based region selection with Google Places API
- Smart scraping with pre-filters (only pay for matching leads)
- Credit-based monetization (1 credit = 1 valid lead)
- Lighthouse website analysis for lead qualification
- AI-powered sales intelligence via Perplexity
- Clerk authentication with 2FA support
- Multi-tenant data isolation
- Admin panel with analytics

---

## Implementation Status (Last Updated: January 2026)

### ✅ IMPLEMENTED

**Backend Modules:**
- `auth` - Clerk + legacy JWT authentication ✅
- `leads` - CRUD with filtering, pagination, pipeline stages ✅
- `activities` - Notes, calls, emails, meetings, tasks ✅
- `tags` - Lead categorization ✅
- `scraping` - Google Maps/Search/Places scrapers with BullMQ ✅
- `dashboard` - Stats and analytics ✅
- `regions` - Predefined city zones ✅
- `credits` - Balance tracking, transactions ✅
- `coupons` - Creation, redemption, bulk generation ✅
- `audit` - Action logging for compliance ✅
- `gdpr` - Data export, account deletion ✅
- `admin` - User management, analytics ✅
- `analysis` - Lighthouse, tech stack, sales intelligence ✅
- `prospects` - Raw scraped businesses management ✅
- `contact` - Website contact form handling ✅

**Frontend Pages:**
- Marketing: Home, About, Services, Pricing, Work, Labs, Contact ✅
- Auth: /sign-in, /sign-up (Clerk) ✅
- User Dashboard: Dashboard, Leads, Scrape, Scrape History, Settings, Credits ✅
- Admin: Dashboard, Leads, Users, Analytics, Prospects, Scraping, Zones, API Logs, Status, Settings ✅

**Database Schema:** Complete with User, Lead (45+ fields), Activity, Tag, ScrapeJob, CreditTransaction, Coupon, AuditLog, etc.

### ❌ NOT YET IMPLEMENTED (Per PRD)

**Critical Features:**
- Follow-up Reminders for leads - PRD 21.4

**Nice-to-Have Features:**
- Keyboard shortcuts - PRD 21.5
- Command palette (Cmd+K) - PRD 21.6
- Export to Excel/Google Sheets - PRD 21.8 (CSV only currently)
- Scrape templates - PRD 21.12
- Lead decay/aging alerts - PRD 21.14
- Dark/Light mode toggle - PRD 21.16 (dark only)
- Onboarding flow - PRD 21.17

**Deployment (Not Done):**
- Deploy backend service to Railway
- Add PostgreSQL database on Railway
- Add Redis on Railway
- Configure environment variables
- Run database migrations
- Seed admin user
- Test full system end-to-end

---

## Development Commands

### Backend (in `backend/`)
```bash
npm run dev              # Start dev server with hot reload (port 3001)
npm run build            # Build for production (generates Prisma client + tsc)
npm run start            # Run production build

# Database
npm run db:push          # Push schema changes (development)
npm run db:migrate       # Create migration
npm run db:migrate:deploy # Apply migrations (production)
npm run db:seed          # Seed admin user + regions
npm run db:studio        # Open Prisma Studio GUI
```

### Frontend (in `website/`)
```bash
npm run dev     # Start dev server (port 3000)
npm run build   # Production build
npm run lint    # Run ESLint
```

### Required Services
- **PostgreSQL 13+**: `brew services start postgresql@16`
- **Redis 6+**: `brew services start redis` (required for scraping job queue)

### Local Database Setup
```bash
createdb boko
cd backend && npm run db:push && npm run db:seed
```

## Architecture

### Backend Module Pattern

Each feature module in `backend/src/modules/` follows routes + service pattern:
- `{module}.routes.ts` - Fastify route handlers with Zod validation schemas
- `{module}.service.ts` - Business logic using Prisma client

**Core Modules:**
- `auth` - Authentication (Clerk + legacy JWT)
- `leads` - Lead CRUD and pipeline management
- `activities` - Notes, calls, tasks on leads
- `scraping` - Job creation and management
- `dashboard` - Stats and analytics

**Monetization Modules:**
- `credits` - Credit balance and transactions
- `coupons` - Coupon creation and redemption

**Analysis Modules:**
- `analysis` - Lighthouse, tech stack, sales intelligence

**Admin Modules:**
- `admin` - User management and analytics
- `audit` - Action logging for compliance
- `gdpr` - Data export and deletion

### Scraping System

The scraping pipeline is orchestrated through BullMQ (`backend/src/jobs/`):

1. **Queue** (`queue.ts`): Redis-backed `'scrape'` queue with 2 worker concurrency
2. **Worker** (`workers/scrape.worker.ts`): Processes jobs, validates against filters, deduplicates leads

**Smart Scraping Flow:**
1. User draws rectangle on map or selects city preset
2. Region divided into 2km x 2km grid cells
3. Each cell searched via Google Places API
4. Leads validated against user's pre-filters
5. Only matching leads saved and charged (1 credit each)

Scrapers in `backend/src/modules/scraping/scrapers/`:
- `google-places.service.ts` - Google Places API (New) with rectangular bounds
- `google-maps.scraper.ts` - Playwright with stealth plugin (legacy)
- `google-search.scraper.ts` - Playwright + Cheerio HTML parsing

### Lead Qualification Logic

Located in `backend/src/modules/qualification/` and `backend/src/modules/analysis/`:
- Uses Lighthouse CLI to analyze website quality
- **NO_WEBSITE** or **POOR_WEBSITE** (score <70) = qualified lead (needs web services)
- **WEBSITE_IS_GOOD** (score >=70) = not qualified (already has good website)

### Credit System

**Costs:**
- 1 credit = 1 valid lead (matching filters)
- 1 credit = 1 Lighthouse analysis
- 1 credit = 1 tech stack detection
- 1 credit = 1 sales intelligence generation

**Key principle:** NO base cost for scraping - users only pay for results that match their criteria.

### Multi-Tenancy Pattern

All user-owned data queries MUST include `userId` filter:
```typescript
// CORRECT - Always filter by userId
const leads = await prisma.lead.findMany({
  where: { userId, ...filters }
});

// WRONG - Never query without userId for user data
const leads = await prisma.lead.findMany({
  where: { ...filters }
});
```

Return 404 (not 403) for resources belonging to other users to prevent enumeration.

### Frontend Structure

Next.js App Router with route groups:
- `app/(main)/` - Public marketing website
- `app/dashboard/` - User dashboard (Clerk protected)
- `app/(admin-area)/[adminPrefix]/` - Admin panel with obscure URL (requires ADMIN role)
- `app/sign-in/` - Clerk sign-in page
- `app/sign-up/` - Clerk sign-up page

**SECURITY NOTE:** Admin panel uses an obscure URL prefix (e.g., `/nucleus-admin-x7k9m2/`) instead of `/admin/` to prevent unauthorized access attempts. See "Admin URL Configuration" section below for details.

API calls go through `website/lib/api-client.ts` - centralized client that handles Clerk tokens and provides typed methods.

### Map-Based Region Selection (Frontend)

The scrape page (`/dashboard/scrape`) uses Leaflet for region selection:

**Components:**
- `components/dashboard/MapSelector.tsx` - Main wrapper with city presets toolbar and state management
- `components/dashboard/LeafletMap.tsx` - Leaflet map with react-leaflet-draw for drawing/editing rectangles

**Key Features:**
- City preset pills (Bangalore, Chennai, etc.) in floating toolbar
- Draw mode for custom rectangle selection (uses react-leaflet-draw)
- Resizable rectangles - drag corners to resize after drawing
- External bounds sync - map zooms to saved regions when selected
- Grid cell overlay showing 2km x 2km cells
- ESC key cancels drawing mode

**Libraries:**
- `react-leaflet` - React wrapper for Leaflet
- `react-leaflet-draw` - Drawing/editing shapes on map
- `leaflet-draw` - Underlying draw library

**Props flow:**
```
ScrapePanel → MapSelector → LeafletMap
              ↓
         externalBounds (from saved regions)
         onBoundsSelected (callback)
         onEstimateUpdate (callback)
```

### Authentication Flow (Clerk)

1. User signs in via Clerk (`/sign-in`)
2. Clerk provides session token
3. Frontend gets token via `useAuth().getToken()`
4. API requests include `Authorization: Bearer {clerk-token}`
5. Backend verifies with `@clerk/backend`
6. Webhook syncs user data to local DB

**Legacy JWT fallback** still works for migration:
- POST `/api/auth/login` returns JWT
- Token stored in localStorage

## Key Configuration

### Backend Environment (`backend/.env`)
```env
# Database
DATABASE_URL=postgresql://user@localhost:5432/boko

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Legacy JWT (fallback)
JWT_SECRET=<random-string>

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
NODE_ENV=development

# Admin URL Prefix (SECURITY)
# Change this periodically and keep it secret
# Must match NEXT_PUBLIC_ADMIN_PREFIX in frontend
ADMIN_URL_PREFIX=nucleus-admin-x7k9m2

# Optional APIs
PERPLEXITY_API_KEY=        # For AI sales intelligence
GOOGLE_PLACES_API_KEY=     # For map-based scraping
```

### Frontend Environment (`website/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Admin URL Prefix (SECURITY)
# Change this periodically and keep it secret
# Must match ADMIN_URL_PREFIX in backend
NEXT_PUBLIC_ADMIN_PREFIX=nucleus-admin-x7k9m2

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
```

## Database Schema

Key models in `backend/prisma/schema.prisma`:

**User & Auth:**
- `User` - clerkId, email, creditBalance, role (USER/ADMIN)
- `CreditTransaction` - type, amount, reference
- `Coupon` - code, creditAmount, maxUses, expiresAt
- `CouponRedemption` - tracks who redeemed what

**Leads:**
- `Lead` - 45+ fields including Lighthouse scores, contact info, pipeline stage
- `Activity` - Notes, calls, emails, meetings, tasks on leads
- `Tag` - Categorization for leads

**Scraping:**
- `ScrapeJob` - status, filters, bounds, totalFound, matchedFilters
- `ScrapingRegion` - Predefined regions with city arrays

**Compliance:**
- `AuditLog` - action, resource, userId, timestamp, details

**Lead Pipeline Stages:** NEW -> CONTACTED -> INTERESTED -> CLOSED

## API Endpoints

Base URL: `http://localhost:3001/api`

### Authentication
- `POST /auth/clerk-webhook` - Clerk event handler
- `GET /auth/me` - Current user profile
- `POST /auth/login` - Legacy JWT login

### Credits & Coupons
- `GET /credits/balance` - Current balance
- `GET /credits/history` - Transaction history
- `POST /coupons/redeem` - Redeem coupon code
- `POST /admin/coupons` - Create coupon (admin)

### Leads
- `GET /leads` - List with filters
- `POST /leads/:id/analyze/lighthouse` - Run Lighthouse (1 credit)
- `POST /leads/:id/analyze/techstack` - Detect tech stack (1 credit)
- `POST /leads/:id/analyze/salesintel` - Generate sales intel (1 credit)

### Scraping
- `POST /scraping/jobs` - Start scrape with filters and bounds
- `GET /scraping/jobs` - List user's jobs
- `POST /scraping/estimate` - Estimate cost for region

### Admin (uses obscure URL prefix)
All admin endpoints use the configured `ADMIN_URL_PREFIX` (e.g., `nucleus-admin-x7k9m2`):
- `GET /{ADMIN_URL_PREFIX}/users` - List all users
- `POST /{ADMIN_URL_PREFIX}/users/:id/credits` - Add credits
- `GET /{ADMIN_URL_PREFIX}/analytics/overview` - Dashboard stats
- `GET /{ADMIN_URL_PREFIX}/audit-logs` - Audit trail

### GDPR
- `GET /user/export` - Export all user data
- `POST /user/delete` - Request account deletion

## Development Patterns

### When Adding a New Module

1. Create `backend/src/modules/{name}/`
2. Add `{name}.service.ts` with business logic
3. Add `{name}.routes.ts` with Fastify routes + Zod schemas
4. Register in `backend/src/index.ts`
5. Always include `userId` in queries for user-owned data

### When Adding Credit-Based Features

```typescript
// Check balance first
const balance = await creditsService.getBalance(userId);
if (balance < cost) {
  return reply.status(402).send({ error: 'Insufficient credits' });
}

// Perform action
const result = await doExpensiveOperation();

// Deduct credits only on success
await creditsService.deductCredits({
  userId,
  amount: cost,
  type: 'ANALYSIS_CHARGE',
  description: 'Lighthouse analysis',
  reference: leadId
});
```

### Parallel Agent Development

This project was built using parallel Claude Code agents. Key learnings:

1. **Schema changes** - Multiple agents can add to Prisma schema if touching different models
2. **Route registration** - All agents should add imports/registrations to `index.ts`
3. **Shared utilities** - Put in `backend/src/utils/` to avoid conflicts
4. **Test locally** after all agents complete - run `npm run db:push` once

## Default Credentials

After running `npm run db:seed`:
- **Email:** admin@boko.io
- **Password:** admin123

For Clerk authentication, sign up with any email through the UI.

## Admin URL Configuration (SECURITY)

The admin panel uses an obscure URL prefix instead of `/admin` to prevent unauthorized access attempts. This is a security-through-obscurity measure that should be combined with proper authentication.

### How It Works

1. **Frontend:** Admin pages are at `/{NEXT_PUBLIC_ADMIN_PREFIX}/` instead of `/admin/`
2. **Backend:** Admin API endpoints are at `/api/{ADMIN_URL_PREFIX}/` instead of `/api/admin/`
3. **Default prefix:** `nucleus-admin-x7k9m2`

### Configuration

Both frontend and backend must use the same prefix:

**Backend (`backend/.env`):**
```env
ADMIN_URL_PREFIX=nucleus-admin-x7k9m2
```

**Frontend (`website/.env.local`):**
```env
NEXT_PUBLIC_ADMIN_PREFIX=nucleus-admin-x7k9m2
```

### Security Recommendations

1. **Change periodically:** Rotate the admin URL prefix quarterly
2. **Use different values:** Use different prefixes for staging and production
3. **Keep secret:** Never commit the actual prefix to version control
4. **Generate randomly:** Use a random string like `nucleus-admin-abc123xyz`

### Accessing Admin Panel

After configuration, access the admin panel at:
- Development: `http://localhost:3000/nucleus-admin-x7k9m2`
- Production: `https://yourdomain.com/{your-secret-prefix}`

### Technical Implementation

- Frontend: Uses Next.js dynamic route segment `[adminPrefix]`
- Backend: Route prefix configured in `backend/src/index.ts`
- Validation: Invalid prefixes return 404 (not 403) to prevent enumeration

## Webhook Testing (Local)

For Clerk webhooks locally, use ngrok:
```bash
ngrok http 3001
# Add the URL to Clerk Dashboard -> Webhooks
# Endpoint: https://your-ngrok-url.ngrok-free.dev/api/auth/clerk-webhook
```
