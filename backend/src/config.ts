const isDev = process.env.NODE_ENV !== 'production';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  isDev,
  logLevel: process.env.LOG_LEVEL || 'info',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/summer_studios',

  // Redis (only use if explicitly provided)
  redisUrl: process.env.REDIS_URL || '',

  // CORS - allow frontend URL
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : [frontendUrl, 'http://localhost:3000', 'http://localhost:3001'],

  // Scraping
  scrapeDelayMs: parseInt(process.env.SCRAPE_DELAY_MS || '3000', 10),
  scrapeMaxRequestsPerMinute: parseInt(process.env.SCRAPE_MAX_REQUESTS_PER_MINUTE || '10', 10),

  // Perplexity
  perplexityApiKey: process.env.PERPLEXITY_API_KEY || '',

  // Frontend
  frontendUrl,
};
