import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { creditsService } from './credits.service.js';
import { CreditTransactionType } from '@prisma/client';

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  type: z.nativeEnum(CreditTransactionType).optional(),
});

export async function creditsRoutes(fastify: FastifyInstance) {
  // All credit routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Get current credit balance
  fastify.get('/balance', async (request, reply) => {
    try {
      const balance = await creditsService.getBalance(request.user.userId);
      return { balance };
    } catch (error) {
      if ((error as Error).message === 'User not found') {
        return reply.status(404).send({ error: 'User not found' });
      }
      throw error;
    }
  });

  // Get credit transaction history
  fastify.get('/history', async (request, reply) => {
    const query = historyQuerySchema.parse(request.query);

    const result = await creditsService.getTransactionHistory({
      userId: request.user.userId,
      limit: query.limit,
      offset: query.offset,
      type: query.type,
    });

    return result;
  });

  // Get monthly credit usage stats
  fastify.get('/monthly-stats', async (request, reply) => {
    try {
      const stats = await creditsService.getMonthlyStats(request.user.userId);
      return stats;
    } catch (error) {
      if ((error as Error).message === 'User not found') {
        return reply.status(404).send({ error: 'User not found' });
      }
      throw error;
    }
  });
}
