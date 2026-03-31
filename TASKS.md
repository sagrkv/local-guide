# Paper Maps - Project Tasks

## Overview
Curated Tourist Map Platform - Paper Maps

---

## Phase 1: Backend Foundation
- [x] Create `backend/` folder structure
- [x] Initialize Fastify + TypeScript project
- [x] Set up Prisma schema (User, Lead, Tag, Activity, ScrapingRegion, ScrapeJob)
- [x] Create module structure (routes, controllers, services)
- [x] Implement JWT authentication
- [x] Build leads CRUD with filtering/pagination
- [x] Implement pipeline stage changes
- [x] Add activity tracking system
- [x] Create tag management
- [x] Build dashboard stats API

## Phase 2: Scraping Engine
- [x] Set up Playwright with stealth plugin
- [x] Build Google Search scraper
- [x] Build Google Maps scraper
- [x] Implement BullMQ job queue
- [x] Integrate Perplexity API service
- [x] Build Lighthouse website analysis
- [x] Build lead scoring engine
- [x] Create scraping regions management

## Phase 3: Admin Dashboard (Frontend)
- [x] Add `/admin` route group to Next.js
- [x] Build admin layout with sidebar
- [x] Create login page
- [x] Build dashboard with stats
- [x] Build Kanban board for leads
- [x] Create lead detail view with activities
- [x] Build scraping job management page
- [x] Build settings page
- [x] Create system status page

## Phase 4: Deployment
- [x] Push code to GitHub
- [x] Deploy website (frontend) to Railway
- [x] Fix TypeScript build errors
- [x] Fix Node.js version requirement
- [ ] **Deploy backend service to Railway**
- [ ] **Add PostgreSQL database on Railway**
- [ ] **Add Redis on Railway (optional)**
- [ ] **Configure backend environment variables**
- [ ] **Configure frontend NEXT_PUBLIC_API_URL**
- [ ] **Run database migrations**
- [ ] **Seed admin user**
- [ ] **Test full system end-to-end**

---

## Deployment Checklist

### Backend Service Setup
| Task | Status | Notes |
|------|--------|-------|
| Create new Railway service for backend | ⬜ Pending | Root directory: `backend` |
| Add PostgreSQL plugin | ⬜ Pending | Auto-provides DATABASE_URL |
| Add Redis plugin | ⬜ Pending | Optional, for job queue |
| Set DATABASE_URL | ⬜ Pending | `${{Postgres.DATABASE_URL}}` |
| Set JWT_SECRET | ⬜ Pending | Random 32+ char string |
| Set FRONTEND_URL | ⬜ Pending | Website URL |
| Set REDIS_URL | ⬜ Pending | `${{Redis.REDIS_URL}}` |
| Set PERPLEXITY_API_KEY | ⬜ Pending | Optional |
| Set SCRAPE_DELAY_MS | ⬜ Pending | Default: 3000 |

### Frontend Service Setup
| Task | Status | Notes |
|------|--------|-------|
| Website deployed | ✅ Done | |
| Set NEXT_PUBLIC_API_URL | ⬜ Pending | Backend URL + `/api` |

### Database Setup
| Task | Status | Notes |
|------|--------|-------|
| Run `prisma migrate deploy` | ⬜ Pending | Creates tables |
| Run `prisma db seed` | ⬜ Pending | Creates admin user |

### Testing
| Task | Status | Notes |
|------|--------|-------|
| Admin login works | ⬜ Pending | |
| Dashboard loads stats | ⬜ Pending | |
| Leads CRUD works | ⬜ Pending | |
| Scraping job can be created | ⬜ Pending | |

---

## Environment Variables Reference

### Backend (`backend/`)
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-secure-random-string
FRONTEND_URL=https://your-site.railway.app
REDIS_URL=${{Redis.REDIS_URL}}
PERPLEXITY_API_KEY=pplx-xxx
SCRAPE_DELAY_MS=3000
```

### Frontend (`website/`)
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
```

---

## Default Admin Credentials
After seeding the database:
- **Email:** admin@papermaps.in
- **Password:** admin123

⚠️ Change this password immediately after first login!

---

## Quick Commands

### Run migrations (in backend/)
```bash
npx prisma migrate deploy
```

### Seed database (in backend/)
```bash
npx prisma db seed
```

### Generate Prisma client (in backend/)
```bash
npx prisma generate
```

---

## Links
- **GitHub:** https://github.com/sagrkv/Summer-Studio
- **Railway Dashboard:** https://railway.app/dashboard
- **Status Page:** https://your-site.railway.app/admin/status
