# Railway Deployment Guide

This guide walks you through deploying Paper Maps to Railway.

## Prerequisites

- [Railway account](https://railway.app/)
- GitHub repository connected to Railway
- (Optional) Perplexity API key for AI enrichment
- (Optional) Google Places API key for enhanced business discovery

---

## Quick Start

### 1. Create Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your Paper Maps repository

### 2. Add Database (PostgreSQL)

1. In your project, click **New** → **Database** → **PostgreSQL**
2. Railway automatically provides `DATABASE_URL` to your services

### 3. Add Redis (for Scraping Queue)

1. Click **New** → **Database** → **Redis**
2. Railway automatically provides `REDIS_URL` to your services

### 4. Create Backend Service

1. Click **New** → **GitHub Repo** → Select your repo
2. Configure:
   - **Root Directory**: `backend`
   - **Start Command**: (uses railway.toml automatically)

3. Add Environment Variables:
   ```
   JWT_SECRET=<generate-a-secure-random-string>
   FRONTEND_URL=https://your-frontend.up.railway.app
   CORS_ORIGINS=https://your-frontend.up.railway.app
   NODE_ENV=production
   ```

4. Optional variables (for full functionality):
   ```
   PERPLEXITY_API_KEY=<your-perplexity-api-key>
   GOOGLE_PLACES_API_KEY=<your-google-places-api-key>
   ```

### 5. Create Frontend Service

1. Click **New** → **GitHub Repo** → Select your repo
2. Configure:
   - **Root Directory**: `website`

3. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app/api
   ```

### 6. Deploy

Railway will automatically build and deploy both services. Monitor the deployment logs for any errors.

---

## Environment Variables Reference

### Backend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Auto-provided by Railway |
| `JWT_SECRET` | Secret key for JWT tokens | `your-32-char-random-string` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://app.example.com` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `https://app.example.com` |
| `NODE_ENV` | Environment mode | `production` |

### Backend (Optional)

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection for job queue | Auto-provided by Railway |
| `PERPLEXITY_API_KEY` | Perplexity API for AI enrichment | (disabled if not set) |
| `GOOGLE_PLACES_API_KEY` | Google Places API | (disabled if not set) |
| `PORT` | Server port | `3001` |
| `JWT_EXPIRES_IN` | JWT token expiry | `7d` |
| `SCRAPE_DELAY_MS` | Delay between scrape requests | `3000` |
| `SCRAPE_MAX_REQUESTS_PER_MINUTE` | Rate limit | `10` |
| `GOOGLE_PLACES_SEARCH_RADIUS` | Search radius in meters | `2000` |

### Frontend (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `https://api.example.com/api` |

---

## Generate Secure JWT Secret

Use one of these methods to generate a secure JWT secret:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Database Migrations

Migrations run automatically on deployment via `prisma migrate deploy`. 

For manual migration:
```bash
# SSH into Railway service or run locally with production DATABASE_URL
npx prisma migrate deploy
```

---

## First Deployment Checklist

- [ ] PostgreSQL database added
- [ ] Redis added (required for scraping)
- [ ] Backend service created with `backend` root directory
- [ ] Frontend service created with `website` root directory
- [ ] `JWT_SECRET` set to secure random value
- [ ] `FRONTEND_URL` set to frontend Railway URL
- [ ] `CORS_ORIGINS` set to frontend Railway URL
- [ ] `NEXT_PUBLIC_API_URL` set to backend Railway URL + `/api`
- [ ] Both services deployed successfully
- [ ] Health check passes: `https://your-backend.up.railway.app/health`

---

## Post-Deployment

### Default Login Credentials

After first deployment, the database is seeded with:
- **Email**: `admin@papermaps.in`
- **Password**: `admin123`

**Important**: Change these credentials immediately after first login!

### Verify Health

```bash
curl https://your-backend.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-23T...",
  "database": true,
  "redis": true
}
```

---

## Troubleshooting

### Backend won't start

1. Check logs in Railway dashboard
2. Verify all required environment variables are set
3. Ensure DATABASE_URL is available (PostgreSQL plugin added)

### CORS errors in browser

1. Verify `CORS_ORIGINS` includes your frontend URL
2. Verify `FRONTEND_URL` is set correctly
3. Check for trailing slashes (should not have them)

### Scraping not working

1. Verify Redis is connected (`redis: true` in health check)
2. Check REDIS_URL is available
3. View worker logs in Railway dashboard

### Database connection errors

1. Verify PostgreSQL plugin is added to project
2. Check DATABASE_URL is properly injected
3. Try redeploying the backend service

### API calls failing from frontend

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check backend is running (health endpoint)
3. Check browser console for CORS errors

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Railway Project                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │  PostgreSQL │    │    Redis    │    │  Frontend   │    │
│   │  (Database) │    │   (Queue)   │    │  (Next.js)  │    │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    │
│          │                  │                   │           │
│          │  DATABASE_URL    │  REDIS_URL        │           │
│          │                  │                   │           │
│          ▼                  ▼                   │           │
│   ┌─────────────────────────────────┐          │           │
│   │           Backend               │◄─────────┘           │
│   │          (Fastify)              │  NEXT_PUBLIC_API_URL │
│   │                                 │                       │
│   │  • REST API                     │                       │
│   │  • BullMQ Workers               │                       │
│   │  • Prisma ORM                   │                       │
│   │  • Playwright Scraping          │                       │
│   └─────────────────────────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Cost Estimation

Railway pricing (as of 2024):
- **Hobby Plan**: $5/month (includes $5 credit)
- **PostgreSQL**: ~$5-10/month depending on usage
- **Redis**: ~$5-10/month depending on usage
- **Backend**: ~$5-10/month (scales with CPU/memory usage)
- **Frontend**: ~$5-10/month (scales with traffic)

**Estimated total**: $20-40/month for a small deployment

---

## Security Recommendations

1. **Change default admin password** immediately after deployment
2. **Use strong JWT_SECRET** (32+ characters, randomly generated)
3. **Restrict CORS_ORIGINS** to only your frontend domain
4. **Enable Railway's DDoS protection** in project settings
5. **Rotate API keys** periodically (Perplexity, Google Places)
6. **Monitor logs** for suspicious activity

---

## Support

For issues with this deployment:
1. Check Railway logs for error messages
2. Verify all environment variables are set correctly
3. Test health endpoint for service status
4. Review this guide's troubleshooting section
