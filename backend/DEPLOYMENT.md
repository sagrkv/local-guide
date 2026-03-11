# Railway Deployment Guide

This document covers deploying the Local Guide backend to Railway, including common issues and their solutions.

## Prerequisites

Before deploying, ensure you have:

1. A Railway account with a project set up
2. PostgreSQL database provisioned in Railway
3. Redis instance provisioned in Railway
4. Environment variables configured (see below)

## Required Environment Variables

Set these in Railway's environment variables section:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (auto-set by Railway if using their Postgres) |
| `REDIS_URL` | Yes | Redis connection string (auto-set by Railway if using their Redis) |
| `JWT_SECRET` | Yes | Secure random string for JWT signing (min 32 chars) |
| `FRONTEND_URL` | Yes | Production frontend URL (e.g., `https://yourdomain.com`) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (defaults to FRONTEND_URL) |
| `PERPLEXITY_API_KEY` | No | For AI-powered business enrichment |
| `GOOGLE_PLACES_API_KEY` | No | For Google Places API discovery |
| `NODE_ENV` | No | Set to `production` (Railway sets this automatically) |

## Deployment Configuration

The `railway.toml` file configures the deployment:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npx prisma db push --skip-generate --accept-data-loss && npm run db:seed && npm run start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[nixpacks]
providers = ["node"]

[nixpacks.apt]
packages = ["chromium", "libnss3", "libatk-bridge2.0-0", "libdrm2", "libxcomposite1", "libxdamage1", "libxrandr2", "libgbm1", "libasound2"]
```

### Why These Settings?

- **`db push --skip-generate`**: Syncs Prisma schema without regenerating client (already done in build)
- **`--accept-data-loss`**: Allows schema changes that might affect data (required for adding unique constraints)
- **`db:seed`**: Seeds admin user and regions (uses upsert, safe to re-run)
- **APT packages**: Required for Playwright/Chromium-based web scraping

## Common Deployment Issues

### 1. Prisma Migrate Error P3005

**Error:**
```
Error: P3005
The database schema is not empty. Read more about how to baseline an existing production database
```

**Cause:** Using `prisma migrate deploy` with no migrations folder, but database already has tables.

**Solution:** Use `prisma db push` instead of `prisma migrate deploy` in the start command.

### 2. Data Loss Warning

**Error:**
```
Error: Use the --accept-data-loss flag to ignore the data loss warnings
```

**Cause:** Schema changes that might affect existing data (e.g., adding unique constraints).

**Solution:** Add `--accept-data-loss` flag to the `db push` command.

### 3. Healthcheck Failures

**Symptom:** Deployment keeps retrying healthcheck and eventually fails.

**Possible Causes:**
- Database connection failing
- Start command failing before server starts
- Server not listening on correct host/port

**Debugging:**
1. Check Railway logs for startup errors
2. Verify `DATABASE_URL` is correct
3. Ensure server binds to `0.0.0.0` (not `localhost`)
4. Verify `/health` endpoint returns 200 OK

### 4. Chromium/Playwright Errors

**Error:** Browser executable not found or missing dependencies.

**Solution:** Ensure `[nixpacks.apt]` packages are configured in `railway.toml`:
```toml
[nixpacks.apt]
packages = ["chromium", "libnss3", "libatk-bridge2.0-0", "libdrm2", "libxcomposite1", "libxdamage1", "libxrandr2", "libgbm1", "libasound2"]
```

### 5. Redis Connection Errors

**Symptom:** Scraping queue not working.

**Cause:** `REDIS_URL` not set or incorrect.

**Solution:** 
- Verify Redis service is provisioned in Railway
- Check `REDIS_URL` environment variable is set
- The app will warn at startup if Redis is not configured

## Build Process

Railway uses Nixpacks to build the application:

1. **Install dependencies**: `npm ci`
2. **Generate Prisma client**: `prisma generate` (via postinstall)
3. **Build TypeScript**: `tsc`
4. **Start**: Runs the configured `startCommand`

## Monitoring

### Health Endpoint

The `/health` endpoint returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-23T12:00:00.000Z",
  "database": true,
  "redis": true
}
```

### Logs

View logs in Railway dashboard or via CLI:
```bash
railway logs
```

## Database Management

### Viewing Data

Use Prisma Studio locally connected to production:
```bash
DATABASE_URL="your-railway-postgres-url" npx prisma studio
```

### Schema Changes

1. Update `prisma/schema.prisma` locally
2. Test with `npm run db:push` locally
3. Commit and push - Railway will apply changes on deploy

### Backups

Railway Postgres includes automatic backups. Configure retention in Railway dashboard.

## Rollback

If a deployment fails:
1. Go to Railway dashboard → Deployments
2. Find the last working deployment
3. Click "Rollback" to redeploy that version

## Troubleshooting Checklist

- [ ] All required environment variables set?
- [ ] PostgreSQL service running and connected?
- [ ] Redis service running and connected?
- [ ] `JWT_SECRET` is a secure value (not dev default)?
- [ ] `FRONTEND_URL` points to production frontend?
- [ ] Check Railway logs for specific errors
- [ ] Verify `/health` endpoint responds correctly
