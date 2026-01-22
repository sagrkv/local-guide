import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authService } from './auth.service.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function authRoutes(fastify: FastifyInstance) {
  // Login
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const result = await authService.login(body.email, body.password);

    if (!result) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const token = fastify.jwt.sign(
      { userId: result.user.id, email: result.user.email, role: result.user.role },
      { expiresIn: '7d' }
    );

    return { token, user: result.user };
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const user = await authService.getUserById(request.user.userId);

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

    const success = await authService.changePassword(
      request.user.userId,
      body.currentPassword,
      body.newPassword
    );

    if (!success) {
      return reply.status(400).send({ error: 'Current password is incorrect' });
    }

    return { message: 'Password changed successfully' };
  });
}
