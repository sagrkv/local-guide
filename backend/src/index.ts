import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { leadsRoutes } from "./modules/leads/leads.routes.js";
import { activitiesRoutes } from "./modules/activities/activities.routes.js";
import { tagsRoutes } from "./modules/tags/tags.routes.js";
import { scrapingRoutes } from "./modules/scraping/scraping.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { regionsRoutes } from "./modules/scraping/regions.routes.js";
import { contactRoutes } from "./modules/contact/contact.routes.js";
import { prospectsRoutes } from "./modules/prospects/prospects.routes.js";
import { creditsRoutes } from "./modules/credits/credits.routes.js";
import { auditRoutes } from "./modules/audit/audit.routes.js";
import { couponsRoutes } from "./modules/coupons/coupons.routes.js";
import { gdprRoutes } from "./modules/gdpr/gdpr.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { analysisRoutes } from "./modules/analysis/analysis.routes.js";
import { remindersRoutes } from "./modules/reminders/reminders.routes.js";
import { savedRegionsRoutes } from "./modules/saved-regions/saved-regions.routes.js";
import { config } from "./config.js";
import { scrapeQueue, worker } from "./jobs/queue.js";
import { clerkAuthenticate, isClerkConfigured } from "./middleware/clerk.js";

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
  // Register plugins
  await fastify.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  });

  await fastify.register(jwt, {
    secret: config.jwtSecret,
  });

  await fastify.register(rateLimit, {
    max: config.nodeEnv === 'development' ? 1000 : 100, // Higher limit for dev/testing
    timeWindow: "1 minute",
  });

  // Decorate with authenticate method
  // Uses Clerk authentication if configured, falls back to JWT for legacy support
  fastify.decorate("authenticate", async function (request: any, reply: any) {
    // If Clerk is configured, use Clerk authentication
    if (isClerkConfigured()) {
      await clerkAuthenticate(request, reply);
      return;
    }

    // Fall back to legacy JWT authentication
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: "Unauthorized" });
    }
  });

  // Health check
  fastify.get("/health", async () => {
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
      database,
      redis,
    };
  });

  // Register routes
  await fastify.register(authRoutes, { prefix: "/api/auth" });
  await fastify.register(leadsRoutes, { prefix: "/api/leads" });
  await fastify.register(activitiesRoutes, { prefix: "/api/activities" });
  await fastify.register(tagsRoutes, { prefix: "/api/tags" });
  await fastify.register(scrapingRoutes, { prefix: "/api/scraping" });
  await fastify.register(regionsRoutes, { prefix: "/api/regions" });
  await fastify.register(dashboardRoutes, { prefix: "/api/dashboard" });
  await fastify.register(contactRoutes, { prefix: "/api/contact" });
  await fastify.register(prospectsRoutes, { prefix: "/api/prospects" });
  await fastify.register(creditsRoutes, { prefix: "/api/credits" });
  // Admin routes use obscure URL prefix for security
  // SECURITY: The admin URL prefix should be kept secret and changed periodically
  await fastify.register(auditRoutes, { prefix: `/api/${config.adminUrlPrefix}/audit-logs` });
  await fastify.register(couponsRoutes, { prefix: "/api" });
  await fastify.register(gdprRoutes, { prefix: "/api/user" });
  await fastify.register(adminRoutes, { prefix: `/api/${config.adminUrlPrefix}` });
  await fastify.register(analysisRoutes, { prefix: "/api/leads" });
  await fastify.register(remindersRoutes, { prefix: "/api/reminders" });
  await fastify.register(savedRegionsRoutes, { prefix: "/api/saved-regions" });

  // Start server
  try {
    await fastify.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`🚀 Server running on port ${config.port}`);
    if (config.isDev) {
      console.log(`   Local: http://localhost:${config.port}`);
    }

    // Log queue/worker status
    if (scrapeQueue && worker) {
      console.log("Scrape queue and worker initialized (Redis connected)");
    } else {
      console.warn(
        "WARNING: Scrape queue not available - Redis not configured. Google Maps/Google Search scraping will not work.",
      );
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

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string; email: string; role: string };
    user: { userId: string; email: string; role: string };
  }
}
