# Summer Studios Lead Management Backend

A backend system for Summer Studios to automate lead generation through web scraping and manage leads through a CRM pipeline.

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

- Email: `admin@summerstudios.in`
- Password: `admin123`

**Important**: Change these credentials in production!

## Deployment (Railway)

The project includes `railway.toml` for Railway deployment. Required services:

1. PostgreSQL database
2. Redis instance
3. This backend service

Set all environment variables in Railway dashboard.
