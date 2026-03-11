# Local Guide Backend

A backend system for Local Guide — curated tourist maps. Manages cities, points of interest, itineraries, and user accounts.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Database**: PostgreSQL + Prisma
- **Scraping**: Playwright + Cheerio
- **AI**: Perplexity API
- **Queue**: BullMQ + Redis
- **Auth**: JWT + bcrypt

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Redis instance

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database and API credentials

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

### Development

```bash
# Start development server with hot reload
npm run dev
```

### Production

```bash
# Build the project
npm run build

# Start production server
npm run start
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `REDIS_URL` | Redis connection string |
| `PERPLEXITY_API_KEY` | Perplexity API key for AI features |
| `CORS_ORIGINS` | Allowed CORS origins |
| `SCRAPE_DELAY_MS` | Delay between scrape requests |

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Current user

### Leads
- `GET /api/leads` - List leads with filters
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create lead
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `PATCH /api/leads/:id/stage` - Change lead stage
- `POST /api/leads/:id/assign` - Assign lead

### Scraping
- `POST /api/scraping/jobs` - Start scrape job
- `GET /api/scraping/jobs` - List jobs
- `GET /api/scraping/jobs/:id` - Job status

### Dashboard
- `GET /api/dashboard/stats` - Overview stats
- `GET /api/dashboard/pipeline` - Pipeline counts

## Default Admin Credentials

After running the seed:

- Email: `admin@localguide.in`
- Password: `admin123`

**Important**: Change these credentials in production!

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing |
| `REDIS_URL` | Yes | Redis connection string (for scraping queue) |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |
| `CORS_ORIGINS` | No | Allowed CORS origins (comma-separated) |
| `PERPLEXITY_API_KEY` | No | Perplexity API key for AI enrichment |
| `GOOGLE_PLACES_API_KEY` | No | Google Places API for discovery |
| `SCRAPE_DELAY_MS` | No | Delay between scrape requests (default: 3000) |

## Deployment (Railway)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed Railway deployment guide, including:

- Environment variable setup
- Common issues and solutions
- Troubleshooting checklist
- Database management

### Quick Start

1. Create Railway project with PostgreSQL and Redis services
2. Connect this repository
3. Set required environment variables
4. Deploy!
