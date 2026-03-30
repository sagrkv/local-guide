const isDev = process.env.NODE_ENV !== "production";

// =============================================================================
// Environment Variable Validation
// =============================================================================

function getRequiredEnv(name: string, devDefault?: string): string {
  const value = process.env[name];
  if (value) return value;

  if (isDev && devDefault !== undefined) {
    console.warn(`Warning: Using development default for ${name}`);
    return devDefault;
  }

  throw new Error(
    `Required environment variable ${name} is not set. Please configure it before starting the server.`,
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
const adminUrlPrefix = getOptionalEnv("ADMIN_URL_PREFIX", "admin-secret-prefix");

// Frontend URL - required in production for CORS
const frontendUrl = getRequiredEnv("FRONTEND_URL", "http://localhost:3000");

// Database URL - required (no safe default)
const databaseUrl = getRequiredEnv(
  "DATABASE_URL",
  "postgresql://localhost:5432/papermaps",
);

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

  // Database
  databaseUrl,

  // Redis (optional - job queue disabled if not provided)
  redisUrl: getOptionalEnv("REDIS_URL", ""),

  // CORS
  corsOrigins,

  // Google Places API (for POI discovery)
  googlePlacesApiKey: getOptionalEnv("GOOGLE_PLACES_API_KEY", ""),

  // Anthropic API (for AI-powered POI enrichment)
  anthropicApiKey: getOptionalEnv("ANTHROPIC_API_KEY", ""),
  anthropicModel: getOptionalEnv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514"),

  // CDN base URL for media assets (falls back to local server URL)
  cdnBaseUrl: getOptionalEnv(
    "CDN_BASE_URL",
    `http://localhost:${parseInt(getOptionalEnv("PORT", "3001"), 10)}`,
  ),

  // Default map tile URL
  defaultMapTileUrl: getOptionalEnv(
    "DEFAULT_MAP_TILE_URL",
    "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
  ),

  // JWT Secret (for simple auth)
  jwtSecret: getOptionalEnv("JWT_SECRET", "paper-maps-dev-secret"),

  // API Keys (for mobile/server-to-server clients)
  apiKeys: (process.env.API_KEYS || "").split(",").filter(Boolean),

  // Frontend
  frontendUrl,
};

// =============================================================================
// Startup Validation Summary
// =============================================================================

if (isDev) {
  console.log("Configuration loaded (development mode)");
} else {
  console.log("Configuration loaded (production mode)");
  console.log(
    `   Database: ${databaseUrl.includes("@") ? databaseUrl.split("@")[1]?.split("/")[0] : "configured"}`,
  );
  console.log(`   Frontend: ${frontendUrl}`);
  console.log(`   CORS: ${corsOrigins.join(", ")}`);
  console.log(
    `   ${config.redisUrl ? "+" : "-"} Redis: ${config.redisUrl ? "configured" : "not configured (job queue disabled)"}`,
  );
  console.log(
    `   ${config.googlePlacesApiKey ? "+" : "-"} Google Places: ${config.googlePlacesApiKey ? "configured" : "not configured"}`,
  );
  console.log(
    `   ${config.anthropicApiKey ? "+" : "-"} Anthropic: ${config.anthropicApiKey ? "configured" : "not configured"}`,
  );
}
