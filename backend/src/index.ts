import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { authRoutes } from './modules/auth/auth.routes.js';
import { leadsRoutes } from './modules/leads/leads.routes.js';
import { activitiesRoutes } from './modules/activities/activities.routes.js';
import { tagsRoutes } from './modules/tags/tags.routes.js';
import { scrapingRoutes } from './modules/scraping/scraping.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { regionsRoutes } from './modules/scraping/regions.routes.js';
import { contactRoutes } from './modules/contact/contact.routes.js';
import { config } from './config.js';

// Only use pino-pretty in dev if available, otherwise use standard JSON logging
let loggerTransport: any = undefined;
if (config.isDev) {
  try {
    require.resolve('pino-pretty');
    loggerTransport = {
      target: 'pino-pretty',
      options: { colorize: true },
    };
  } catch {
    // pino-pretty not available, use default JSON logging
  }
}

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
    max: 100,
    timeWindow: '1 minute',
  });

  // Decorate with authenticate method
  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Health check
  fastify.get('/health', async () => {
    let database = false;
    let redis = false;

    // Check database
    try {
      const { prisma } = await import('./lib/prisma.js');
      await prisma.$queryRaw`SELECT 1`;
      database = true;
    } catch {
      database = false;
    }

    // Check Redis (just check if URL is configured)
    redis = !!config.redisUrl;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database,
      redis,
    };
  });

  // Register routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(leadsRoutes, { prefix: '/api/leads' });
  await fastify.register(activitiesRoutes, { prefix: '/api/activities' });
  await fastify.register(tagsRoutes, { prefix: '/api/tags' });
  await fastify.register(scrapingRoutes, { prefix: '/api/scraping' });
  await fastify.register(regionsRoutes, { prefix: '/api/regions' });
  await fastify.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await fastify.register(contactRoutes, { prefix: '/api/contact' });

  // Start server
  try {
    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: any, reply: any) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: string; email: string; role: string };
    user: { userId: string; email: string; role: string };
  }
}
