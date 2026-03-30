import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { config } from '../config.js';

/**
 * Extract bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Fastify preHandler to authenticate requests using JWT.
 * Supports two auth methods:
 *   1. API key via X-Api-Key header (for mobile/server-to-server clients)
 *   2. JWT Bearer token via Authorization header
 */
export async function jwtAuthenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // -----------------------------------------------------------------
  // 1. Check for API key first (mobile / server-to-server clients)
  // -----------------------------------------------------------------
  const apiKey = request.headers['x-api-key'] as string | undefined;
  if (apiKey && config.apiKeys.length > 0 && config.apiKeys.includes(apiKey)) {
    // API key auth — attach a minimal viewer-level user
    (request as any).user = {
      userId: 'api-key-user',
      email: 'api@papermaps.in',
      role: 'VIEWER',
    };
    return;
  }

  // -----------------------------------------------------------------
  // 2. Fall back to JWT Bearer token auth
  // -----------------------------------------------------------------
  const authHeader = request.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return reply.status(401).send({ error: 'No authorization token provided' });
  }

  try {
    const decoded = (request as any).server.jwt.verify(token) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return reply.status(401).send({ error: 'User not found' });
    }

    if (!user.isActive) {
      return reply.status(403).send({ error: 'Account is deactivated' });
    }

    (request as any).user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}
