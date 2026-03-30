import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import compress from "@fastify/compress";
import fastifyJwt from "@fastify/jwt";
import { randomUUID } from "crypto";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { tagsRoutes } from "./modules/tags/tags.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { auditRoutes } from "./modules/audit/audit.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { citiesRoutes } from "./modules/cities/cities.routes.js";
import { themesRoutes } from "./modules/themes/themes.routes.js";
import { categoriesRoutes, cityCategoriesRoutes } from "./modules/categories/categories.routes.js";
import { poisRoutes } from "./modules/pois/pois.routes.js";
import { poiPhotosRoutes } from "./modules/poi-photos/poi-photos.routes.js";
import { syncRoutes } from "./modules/sync/sync.routes.js";
import { itinerariesRoutes } from "./modules/itineraries/itineraries.routes.js";
import { collectionsRoutes } from "./modules/collections/collections.routes.js";
import { discoveryRoutes } from "./modules/discovery/discovery.routes.js";
import { placesRoutes } from "./modules/places/places.routes.js";
import { enrichmentRoutes } from "./modules/ai/enrichment.routes.js";
import { itineraryGeneratorRoutes } from "./modules/ai/itinerary-generator.routes.js";
import { curatorsRoutes, cityCuratorRoutes, adminCuratorRoutes } from "./modules/curators/curators.routes.js";
import { suggestionsRoutes } from "./modules/suggestions/suggestions.routes.js";
import { autoResearchRoutes, feedbackRoutes } from "./modules/autoResearch/autoResearch.routes.js";
import { config } from "./config.js";
import { jwtAuthenticate } from "./middleware/jwt.js";

// Only use pino-pretty in dev if available, otherwise use standard JSON logging
// In production, always use JSON logging for better log aggregation
const loggerTransport = config.isDev
  ? {
      target: "pino-pretty",
      options: { colorize: true },
    }
  : undefined;

const fastify = Fastify({
  logger: {
    level: config.logLevel,
    transport: loggerTransport,
  },
});

async function main() {
  // =========================================================================
  // Plugins
  // =========================================================================

  // Response compression
  await fastify.register(compress, { global: true });

  // JWT plugin for simple auth
  await fastify.register(fastifyJwt, {
    secret: config.jwtSecret,
  });

  // CORS - allow requests without Origin header (for mobile clients - #52)
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        cb(null, true);
        return;
      }
      // Check against configured origins
      if (config.corsOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
  });

  // Rate limiting with per-route config (#56)
  await fastify.register(rateLimit, {
    max: config.isDev ? 1000 : 100,
    timeWindow: "1 minute",
  });

  // =========================================================================
  // Hooks
  // =========================================================================

  // Add X-Request-Id header to all responses & log mobile platform
  fastify.addHook("onRequest", async (request, reply) => {
    const requestId = (request.headers["x-request-id"] as string) || randomUUID();
    reply.header("X-Request-Id", requestId);

    // Log mobile client platform if provided (#52)
    const platform = request.headers["x-platform"] as string;
    if (platform) {
      request.log.info({ platform }, "Request from mobile client");
    }
  });

  // =========================================================================
  // Authentication decorator
  // =========================================================================
  fastify.decorate("authenticate", async function (request: any, reply: any) {
    await jwtAuthenticate(request, reply);
  });

  // =========================================================================
  // Health check (no version prefix)
  // =========================================================================
  const healthHandler = async () => {
    let database = false;
    let redis = false;

    // Check database
    try {
      const { prisma } = await import("./lib/prisma.js");
      await prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch {
      database = false;
    }

    // Check Redis (just check if URL is configured)
    redis = !!config.redisUrl;

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      database,
      redis,
    };
  };

  fastify.get("/health", healthHandler);

  // =========================================================================
  // API v1 Routes
  // =========================================================================

  // Auth routes
  await fastify.register(authRoutes, { prefix: "/api/v1/auth" });

  // Tags
  await fastify.register(tagsRoutes, { prefix: "/api/v1/tags" });

  // Dashboard
  await fastify.register(dashboardRoutes, { prefix: "/api/v1/dashboard" });

  // Admin routes use obscure URL prefix for security
  await fastify.register(auditRoutes, {
    prefix: `/api/v1/${config.adminUrlPrefix}/audit-logs`,
  });
  await fastify.register(adminRoutes, {
    prefix: `/api/v1/${config.adminUrlPrefix}`,
  });

  // Cities
  await fastify.register(citiesRoutes, { prefix: "/api/v1/cities" });

  // Themes (nested under cities)
  await fastify.register(themesRoutes, { prefix: "/api/v1" });

  // Categories
  await fastify.register(categoriesRoutes, { prefix: "/api/v1/categories" });
  await fastify.register(cityCategoriesRoutes, { prefix: "/api/v1" });

  // POIs (routes define /cities/:cityId/pois and /pois/:id internally)
  await fastify.register(poisRoutes, { prefix: "/api/v1" });

  // POI Photos (routes define /pois/:poiId/photos and /photos/:id internally)
  await fastify.register(poiPhotosRoutes, { prefix: "/api/v1" });

  // Sync endpoint
  await fastify.register(syncRoutes, { prefix: "/api/v1" });

  // Itineraries (routes define /cities/:cityId/itineraries and /itineraries/:id internally)
  await fastify.register(itinerariesRoutes, { prefix: "/api/v1" });

  // Collections (routes define /cities/:cityId/collections and /collections/:id internally)
  await fastify.register(collectionsRoutes, { prefix: "/api/v1" });

  // Discovery jobs
  await fastify.register(discoveryRoutes, { prefix: "/api/v1" });

  // Google Places search
  await fastify.register(placesRoutes, { prefix: "/api/v1" });

  // AI Enrichment
  await fastify.register(enrichmentRoutes, { prefix: "/api/v1" });

  // AI Itinerary Generator (curator-reviewed before publish)
  await fastify.register(itineraryGeneratorRoutes, { prefix: "/api/v1" });

  // Curators (public profiles + admin management)
  await fastify.register(curatorsRoutes, { prefix: "/api/v1/curators" });
  await fastify.register(cityCuratorRoutes, { prefix: "/api/v1" });
  await fastify.register(adminCuratorRoutes, {
    prefix: `/api/v1/${config.adminUrlPrefix}`,
  });

  // Community POI suggestions (public, rate-limited)
  await fastify.register(suggestionsRoutes, { prefix: "/api/v1" });

  // AutoResearch (admin routes — behind obscure prefix)
  await fastify.register(autoResearchRoutes, {
    prefix: `/api/v1/${config.adminUrlPrefix}/auto-research`,
  });

  // AutoResearch feedback (public — no auth, rate-limited)
  await fastify.register(feedbackRoutes, { prefix: "/api/v1/feedback" });

  // =========================================================================
  // Start server
  // =========================================================================
  try {
    await fastify.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`Server running on port ${config.port}`);
    if (config.isDev) {
      console.log(`   Local: http://localhost:${config.port}`);
      console.log(`   Health: http://localhost:${config.port}/health`);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();

// Type augmentation for Fastify
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
}
