import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { couponsService } from './coupons.service.js';

const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, 'Code must be at least 3 characters')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only contain letters, numbers, underscores, and hyphens'),
  creditAmount: z.number().int().positive('Credit amount must be a positive integer'),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
});

const redeemCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
});

export async function couponsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // ============================================
  // Admin Routes (require ADMIN role)
  // ============================================

  // POST /api/admin/coupons - Create a new coupon (admin only)
  fastify.post('/admin/coupons', async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const data = createCouponSchema.parse(request.body);

    try {
      const coupon = await couponsService.createCoupon(request.user.userId, {
        code: data.code,
        creditAmount: data.creditAmount,
        maxUses: data.maxUses ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      });

      return reply.status(201).send(coupon);
    } catch (error) {
      if (error instanceof Error && error.message === 'Coupon with this code already exists') {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }
  });

  // GET /api/admin/coupons - List all coupons (admin only)
  fastify.get('/admin/coupons', async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const querySchema = z.object({
      includeInactive: z
        .string()
        .optional()
        .transform((val) => val === 'true'),
    });

    const { includeInactive } = querySchema.parse(request.query);
    const coupons = await couponsService.listCoupons({ includeInactive });

    return coupons;
  });

  // GET /api/admin/coupons/stats - Get coupon statistics (admin only)
  fastify.get('/admin/coupons/stats', async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const stats = await couponsService.getCouponStats();
    return stats;
  });

  // GET /api/admin/coupons/:id - Get coupon details with redemptions (admin only)
  fastify.get('/admin/coupons/:id', async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const { id } = request.params as { id: string };
    const coupon = await couponsService.getCouponById(id);

    if (!coupon) {
      return reply.status(404).send({ error: 'Coupon not found' });
    }

    return coupon;
  });

  // PATCH /api/admin/coupons/:id/deactivate - Deactivate a coupon (admin only)
  fastify.patch('/admin/coupons/:id/deactivate', async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const { id } = request.params as { id: string };
    const coupon = await couponsService.deactivateCoupon(id);

    if (!coupon) {
      return reply.status(404).send({ error: 'Coupon not found' });
    }

    return coupon;
  });

  // PATCH /api/admin/coupons/:id/activate - Reactivate a coupon (admin only)
  fastify.patch('/admin/coupons/:id/activate', async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const { id } = request.params as { id: string };
    const coupon = await couponsService.activateCoupon(id);

    if (!coupon) {
      return reply.status(404).send({ error: 'Coupon not found' });
    }

    return coupon;
  });

  // DELETE /api/admin/coupons/:id - Delete a coupon (admin only, only if no redemptions)
  fastify.delete('/admin/coupons/:id', async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' });
    }

    const { id } = request.params as { id: string };
    const result = await couponsService.deleteCoupon(id);

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return { message: 'Coupon deleted successfully' };
  });

  // ============================================
  // User Routes (any authenticated user)
  // ============================================

  // POST /api/coupons/redeem - Redeem a coupon code
  fastify.post('/coupons/redeem', async (request, reply) => {
    const data = redeemCouponSchema.parse(request.body);

    const result = await couponsService.redeemCoupon(request.user.userId, data.code);

    if (!result.success) {
      return reply.status(400).send({ error: result.error });
    }

    return {
      message: 'Coupon redeemed successfully',
      creditsAdded: result.creditsAdded,
      newBalance: result.newBalance,
    };
  });

  // POST /api/coupons/validate - Validate a coupon code without redeeming
  fastify.post('/coupons/validate', async (request, reply) => {
    const data = redeemCouponSchema.parse(request.body);

    const result = await couponsService.validateCoupon(data.code, request.user.userId);

    if (!result.valid) {
      return reply.status(400).send({ valid: false, error: result.error });
    }

    return {
      valid: true,
      creditAmount: result.coupon?.creditAmount,
    };
  });
}
