import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { config } from "../lib/config.js";

async function rateLimitPlugin(fastify: FastifyInstance) {
  const options: Parameters<typeof rateLimit>[1] = {
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => {
      return request.clerkUserId || request.ip;
    },
    addHeadersOnExceeding: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
    addHeaders: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
      "retry-after": true,
    },
  };

  // Use Redis store if available
  if (config.REDIS_URL) {
    try {
      const { Redis } = await import("ioredis");
      const redis = new Redis(config.REDIS_URL);
      (options as any).redis = redis;
    } catch {
      fastify.log.warn("Redis not available for rate limiting, using in-memory store");
    }
  }

  await fastify.register(rateLimit, options);
}

export default fp(rateLimitPlugin, { name: "rate-limit" });
