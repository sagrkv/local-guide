import { createClerkClient, verifyToken } from '@clerk/backend';
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma.js';

// Initialize Clerk client
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey && process.env.NODE_ENV === 'production') {
  throw new Error('CLERK_SECRET_KEY is required in production');
}

export const clerkClient = clerkSecretKey
  ? createClerkClient({ secretKey: clerkSecretKey })
  : null;

/**
 * Verify Clerk session token from Authorization header
 */
export async function verifyClerkToken(token: string) {
  if (!clerkSecretKey) {
    console.warn('Clerk not configured - skipping token verification');
    return null;
  }

  try {
    const sessionClaims = await verifyToken(token, {
      secretKey: clerkSecretKey,
    });
    return sessionClaims;
  } catch (error) {
    console.error('Clerk token verification failed:', error);
    return null;
  }
}

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
 * Fastify preHandler to authenticate requests using Clerk
 * This replaces the JWT-based authentication
 */
export async function clerkAuthenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  const token = extractBearerToken(authHeader);

  if (!token) {
    return reply.status(401).send({ error: 'No authorization token provided' });
  }

  // Try Clerk authentication first
  const clerkSession = await verifyClerkToken(token);

  if (clerkSession) {
    // Clerk authentication successful
    const clerkUserId = clerkSession.sub;

    // Find user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      // User exists in Clerk but not in local DB
      // Auto-create the user by fetching from Clerk
      const clerkUser = await getClerkUser(clerkUserId);

      if (!clerkUser) {
        return reply.status(401).send({
          error: 'Unable to verify user. Please try again.',
        });
      }

      const email = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        return reply.status(401).send({
          error: 'No email associated with account.',
        });
      }

      // Create user in local database
      const firstName = clerkUser.firstName || '';
      const lastName = clerkUser.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || email.split('@')[0];

      const newUser = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email,
          name: fullName,
          imageUrl: clerkUser.imageUrl || undefined,
          role: 'SALES_REP',
          isActive: true,
          creditBalance: 100, // Starting credits for new users
        },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      console.log(`Auto-created user from Clerk: ${email} (${clerkUserId})`);

      // Attach user info to request
      (request as any).user = {
        userId: newUser.id,
        clerkId: clerkUserId,
        email: newUser.email,
        role: newUser.role,
      };

      return;
    }

    if (!user.isActive) {
      return reply.status(403).send({ error: 'Account is deactivated' });
    }

    // Attach user info to request
    (request as any).user = {
      userId: user.id,
      clerkId: clerkUserId,
      email: user.email,
      role: user.role,
    };

    return;
  }

  // If Clerk verification fails, try legacy JWT for backward compatibility
  // This allows existing sessions to continue working during migration
  try {
    await (request as any).jwtVerify();
    // JWT verification successful - legacy auth path
    return;
  } catch {
    // Both auth methods failed
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

/**
 * Get user from Clerk by clerk ID
 */
export async function getClerkUser(clerkUserId: string) {
  if (!clerkClient) {
    return null;
  }

  try {
    const user = await clerkClient.users.getUser(clerkUserId);
    return user;
  } catch (error) {
    console.error('Failed to get Clerk user:', error);
    return null;
  }
}

/**
 * Check if Clerk is configured
 */
export function isClerkConfigured(): boolean {
  return !!clerkSecretKey;
}
