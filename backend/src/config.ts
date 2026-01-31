const isDev = process.env.NODE_ENV !== "production";

// =============================================================================
// Environment Variable Validation
// =============================================================================

function getRequiredEnv(name: string, devDefault?: string): string {
  const value = process.env[name];
  if (value) return value;

  if (isDev && devDefault !== undefined) {
    console.warn(`⚠️  Using development default for ${name}`);
    return devDefault;
  }

  throw new Error(
    `❌ Required environment variable ${name} is not set. Please configure it before starting the server.`,
  );
}

function getOptionalEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

// =============================================================================
// Configuration
// =============================================================================

// Admin URL prefix - obscure URL for security
// SECURITY: Change this prefix periodically and keep it secret
// Default: nucleus-admin-x7k9m2 (should be changed in production)
const adminUrlPrefix = getOptionalEnv("ADMIN_URL_PREFIX", "nucleus-admin-x7k9m2");

// Frontend URL - required in production for CORS
const frontendUrl = getRequiredEnv("FRONTEND_URL", "http://localhost:3000");

// Database URL - required (no safe default)
const databaseUrl = getRequiredEnv(
  "DATABASE_URL",
  "postgresql://localhost:5432/boko",
);

// JWT Secret - required in production (insecure default only for dev)
const jwtSecret = getRequiredEnv("JWT_SECRET", "dev-only-insecure-jwt-secret");

// Validate JWT secret is not the dev default in production
if (!isDev && jwtSecret === "dev-only-insecure-jwt-secret") {
  throw new Error("❌ JWT_SECRET must be set to a secure value in production");
}

// CORS origins - parse from env or use frontend URL
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : isDev
    ? [frontendUrl, "http://localhost:3000", "http://localhost:3001"]
    : [frontendUrl]; // Production: only allow configured frontend

export const config = {
  port: parseInt(getOptionalEnv("PORT", "3001"), 10),
  isDev,
  logLevel: getOptionalEnv("LOG_LEVEL", "info"),

  // Admin URL prefix (obscure URL for security)
  // SECURITY: Change this periodically to prevent unauthorized access attempts
  adminUrlPrefix,

  // JWT
  jwtSecret,
  jwtExpiresIn: getOptionalEnv("JWT_EXPIRES_IN", "7d"),

  // Database
  databaseUrl,

  // Redis (optional - scraping queue disabled if not provided)
  redisUrl: getOptionalEnv("REDIS_URL", ""),

  // CORS
  corsOrigins,

  // Scraping
  scrapeDelayMs: parseInt(getOptionalEnv("SCRAPE_DELAY_MS", "3000"), 10),
  scrapeMaxRequestsPerMinute: parseInt(
    getOptionalEnv("SCRAPE_MAX_REQUESTS_PER_MINUTE", "10"),
    10,
  ),

  // Perplexity (optional - AI enrichment disabled if not provided)
  perplexityApiKey: getOptionalEnv("PERPLEXITY_API_KEY", ""),

  // Google Places API (optional - Google Places search disabled if not provided)
  googlePlacesApiKey: getOptionalEnv("GOOGLE_PLACES_API_KEY", ""),
  googlePlacesSearchRadius: 2000, // meters - covers most city areas well

  // Frontend
  frontendUrl,
};

// =============================================================================
// Startup Validation Summary
// =============================================================================

if (isDev) {
  console.log("📋 Configuration loaded (development mode)");
} else {
  console.log("📋 Configuration loaded (production mode)");
  console.log(
    `   ✓ Database: ${databaseUrl.includes("@") ? databaseUrl.split("@")[1]?.split("/")[0] : "configured"}`,
  );
  console.log(`   ✓ Frontend: ${frontendUrl}`);
  console.log(`   ✓ CORS: ${corsOrigins.join(", ")}`);
  console.log(
    `   ${config.redisUrl ? "✓" : "○"} Redis: ${config.redisUrl ? "configured" : "not configured (scraping queue disabled)"}`,
  );
  console.log(
    `   ${config.perplexityApiKey ? "✓" : "○"} Perplexity: ${config.perplexityApiKey ? "configured" : "not configured"}`,
  );
  console.log(
    `   ${config.googlePlacesApiKey ? "✓" : "○"} Google Places: ${config.googlePlacesApiKey ? "configured" : "not configured"}`,
  );
}
