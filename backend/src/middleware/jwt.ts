import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

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
 * Fastify preHandler to authenticate requests using JWT
 */
export async function jwtAuthenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
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
