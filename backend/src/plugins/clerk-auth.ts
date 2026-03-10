import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import { verifyToken } from "@clerk/fastify";
import { config } from "../lib/config.js";
import { UnauthorizedError } from "../lib/errors.js";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
    clerkUserId?: string;
  }
}

async function clerkAuthPlugin(fastify: FastifyInstance) {
  // Decorate request with auth fields
  fastify.decorateRequest("userId", undefined);
  fastify.decorateRequest("clerkUserId", undefined);
}

export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or invalid authorization header");
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: config.CLERK_SECRET_KEY,
    });
    request.clerkUserId = payload.sub;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export default fp(clerkAuthPlugin, { name: "clerk-auth" });
