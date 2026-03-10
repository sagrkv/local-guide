import Fastify, { FastifyInstance } from "fastify";
import errorHandler from "./plugins/error-handler.js";
import requestId from "./plugins/request-id.js";
import compressPlugin from "./plugins/compress.js";
import corsPlugin from "./plugins/cors.js";
import rateLimitPlugin from "./plugins/rate-limit.js";
import healthRoutes from "./routes/health.js";
import v1Routes from "./routes/v1/index.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      transport:
        process.env.NODE_ENV !== "production"
          ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } }
          : undefined,
    },
  });

  // Plugins
  await app.register(requestId);
  await app.register(errorHandler);
  await app.register(corsPlugin);
  await app.register(compressPlugin);
  await app.register(rateLimitPlugin);

  // Health check (unversioned)
  await app.register(healthRoutes);

  // V1 API routes
  await app.register(v1Routes, { prefix: "/api/v1" });

  // Redirect /api/* to /api/v1/*
  app.all("/api/*", async (request, reply) => {
    const path = (request.params as { "*": string })["*"];
    return reply.redirect(`/api/v1/${path}`);
  });

  return app;
}
