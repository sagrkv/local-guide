import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authService } from './auth.service.js';
import { config } from '../../config.js';
import { auditService, AuditActions, AuditResources } from '../audit/audit.service.js';
import { clerkWebhookRoutes } from './clerk-webhook.js';
import { isClerkConfigured, getClerkUser } from '../../middleware/clerk.js';
import { prisma } from '../../lib/prisma.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register Clerk webhook routes
  await fastify.register(clerkWebhookRoutes);

  // Login - Legacy endpoint for backward compatibility during migration
  // New users should use Clerk's hosted UI for authentication
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    const result = await authService.login(body.email, body.password);

    if (!result) {
      // Log failed login attempt
      await auditService.logAction({
        action: AuditActions.LOGIN_FAILURE,
        resource: AuditResources.USER,
        details: { email: body.email },
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'Invalid email or password',
      });

      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const token = fastify.jwt.sign(
      { userId: result.user.id, email: result.user.email, role: result.user.role },
      { expiresIn: config.jwtExpiresIn }
    );

    // Log successful login
    await auditService.logAction({
      userId: result.user.id,
      action: AuditActions.LOGIN_SUCCESS,
      resource: AuditResources.USER,
      resourceId: result.user.id,
      details: { email: result.user.email },
      ipAddress,
      userAgent,
      success: true,
    });

    return { token, user: result.user };
  });

  // Get current user
  // Works with both Clerk tokens and legacy JWT tokens
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userRequest = request as any;

    // If using Clerk authentication and have clerkId, fetch fresh data
    if (userRequest.user.clerkId && isClerkConfigured()) {
      const clerkUser = await getClerkUser(userRequest.user.clerkId);

      // Get local user data with extended fields
      const user = await prisma.user.findUnique({
        where: { id: userRequest.user.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          creditBalance: true,
          imageUrl: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return {
        user: {
          ...user,
          // Merge with fresh Clerk data if available
          imageUrl: clerkUser?.imageUrl ?? user.imageUrl,
        },
      };
    }

    // Legacy JWT path
    const user = await authService.getUserById(userRequest.user.userId);

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return { user };
  });

  // Change password
  fastify.post('/change-password', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const schema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    });

    const body = schema.parse(request.body);
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    const success = await authService.changePassword(
      request.user.userId,
      body.currentPassword,
      body.newPassword
    );

    if (!success) {
      await auditService.logAction({
        userId: request.user.userId,
        action: AuditActions.PASSWORD_CHANGED,
        resource: AuditResources.USER,
        resourceId: request.user.userId,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: 'Current password is incorrect',
      });

      return reply.status(400).send({ error: 'Current password is incorrect' });
    }

    await auditService.logAction({
      userId: request.user.userId,
      action: AuditActions.PASSWORD_CHANGED,
      resource: AuditResources.USER,
      resourceId: request.user.userId,
      ipAddress,
      userAgent,
      success: true,
    });

    return { message: 'Password changed successfully' };
  });
}
