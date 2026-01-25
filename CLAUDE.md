# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Leedo is a B2B lead generation SaaS platform that automates lead discovery through web scraping and manages leads through a sales pipeline. It consists of a Fastify backend with BullMQ job queues and a Next.js frontend with user dashboard.

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
createdb leedo
cd backend && npm run db:push && npm run db:seed
```

## Architecture

### Backend Module Pattern

Each feature module in `backend/src/modules/` follows routes + service pattern:
- `{module}.routes.ts` - Fastify route handlers with Zod validation schemas
- `{module}.service.ts` - Business logic using Prisma client

Modules: `auth`, `leads`, `activities`, `tags`, `scraping`, `qualification`, `dashboard`, `contact`

### Scraping System

The scraping pipeline is orchestrated through BullMQ (`backend/src/jobs/`):

1. **Queue** (`queue.ts`): Redis-backed `'scrape'` queue with 2 worker concurrency
2. **Worker** (`workers/scrape.worker.ts`): Processes jobs, deduplicates leads, handles qualification

Scrapers in `backend/src/modules/scraping/scrapers/`:
- `google-maps.scraper.ts` - Playwright with stealth plugin, scrolling, email extraction
- `google-search.scraper.ts` - Playwright + Cheerio HTML parsing
- `perplexity.ts` (in utils) - AI-powered business research via Perplexity API

**DISCOVERY_PIPELINE** job type combines all three: Google Maps discovery -> Lighthouse qualification -> Perplexity enrichment.

### Lead Qualification Logic

Located in `backend/src/modules/qualification/`:
- Uses Lighthouse CLI to analyze website quality
- **NO_WEBSITE** or **POOR_WEBSITE** (score <70) = qualified lead (needs web services)
- **WEBSITE_IS_GOOD** (score >=70) = not qualified (already has good website)

### Frontend Structure

Next.js App Router with two route groups:
- `app/(main)/` - Public website (landing, services, contact)
- `app/admin/` - Protected dashboard requiring JWT auth

API calls go through `website/lib/api-client.ts` - centralized client that handles auth tokens and provides typed methods for all endpoints.

### Authentication Flow

1. POST to `/api/auth/login` returns JWT token
2. Token stored in `localStorage`
3. All API requests include `Authorization: Bearer {token}` header
4. 401 responses redirect to `/admin/login`

## Key Configuration

### Backend Environment (`backend/.env`)
```env
DATABASE_URL=postgresql://user@localhost:5432/leedo
REDIS_URL=redis://localhost:6379
JWT_SECRET=<random-string>
PERPLEXITY_API_KEY=<optional>
SCRAPE_DELAY_MS=3000
SCRAPE_MAX_REQUESTS_PER_MINUTE=10
```

### Frontend Environment (`website/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Database Schema

Key models in `backend/prisma/schema.prisma`:
- **Lead**: 45+ fields including Lighthouse scores, contact info, pipeline stage
- **ScrapeJob**: Job tracking with status (PENDING->RUNNING->COMPLETED/FAILED)
- **ScrapingRegion**: Geographic regions with city arrays for batch scraping
- **Activity**: Audit trail (NOTE, CALL, EMAIL, MEETING, TASK)

Lead pipeline stages: NEW -> CONTACTED -> QUALIFIED -> PROPOSAL -> NEGOTIATION -> WON/LOST

## API Endpoints

Base URL: `http://localhost:3001/api`

- `POST /auth/login` - Returns JWT token
- `GET /leads` - List with filters (stage, category, city, score)
- `POST /scraping/jobs` - Start scrape job (type: GOOGLE_MAPS | GOOGLE_SEARCH | PERPLEXITY | DISCOVERY_PIPELINE)
- `GET /dashboard/stats` - KPIs and pipeline counts
- `GET /health` - System health (database + Redis status)

Swagger docs available at `http://localhost:3001/documentation`

## Default Credentials

After running `npm run db:seed`:
- **Email:** admin@leedo.io
- **Password:** admin123
