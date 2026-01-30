import { prisma } from '../../lib/prisma.js';

interface CreateCouponData {
  code: string;
  creditAmount: number;
  maxUses?: number | null;
  expiresAt?: Date | null;
}

interface RedeemCouponResult {
  success: boolean;
  error?: string;
  creditsAdded?: number;
  newBalance?: number;
}

interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: {
    id: string;
    code: string;
    creditAmount: number;
    maxUses: number | null;
    currentUses: number;
    expiresAt: Date | null;
    isActive: boolean;
  };
}

export const couponsService = {
  async createCoupon(adminId: string, data: CreateCouponData) {
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCoupon) {
      throw new Error('Coupon with this code already exists');
    }

    return prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        creditAmount: data.creditAmount,
        maxUses: data.maxUses ?? null,
        expiresAt: data.expiresAt ?? null,
        createdBy: adminId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { redemptions: true },
        },
      },
    });
  },

  async validateCoupon(code: string, userId: string): Promise<CouponValidationResult> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return { valid: false, error: 'Coupon not found' };
    }

    if (!coupon.isActive) {
      return { valid: false, error: 'Coupon is no longer active' };
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return { valid: false, error: 'Coupon has expired' };
    }

    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return { valid: false, error: 'Coupon has reached its maximum number of uses' };
    }

    const existingRedemption = await prisma.couponRedemption.findUnique({
      where: {
        couponId_userId: {
          couponId: coupon.id,
          userId: userId,
        },
      },
    });

    if (existingRedemption) {
      return { valid: false, error: 'You have already redeemed this coupon' };
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        creditAmount: coupon.creditAmount,
        maxUses: coupon.maxUses,
        currentUses: coupon.currentUses,
        expiresAt: coupon.expiresAt,
        isActive: coupon.isActive,
      },
    };
  },

  async redeemCoupon(userId: string, code: string): Promise<RedeemCouponResult> {
    const validation = await this.validateCoupon(code, userId);

    if (!validation.valid || !validation.coupon) {
      return { success: false, error: validation.error };
    }

    const coupon = validation.coupon;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Create redemption record
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            userId: userId,
          },
        });

        // Increment coupon usage count
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { currentUses: { increment: 1 } },
        });

        // Add credits to user
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { creditBalance: { increment: coupon.creditAmount } },
        });

        // Create credit transaction record
        await tx.creditTransaction.create({
          data: {
            userId: userId,
            amount: coupon.creditAmount,
            type: 'COUPON_REDEMPTION',
            description: `Redeemed coupon code: ${coupon.code}`,
            reference: coupon.code,
          },
        });

        return {
          creditsAdded: coupon.creditAmount,
          newBalance: updatedUser.creditBalance,
        };
      });

      return {
        success: true,
        creditsAdded: result.creditsAdded,
        newBalance: result.newBalance,
      };
    } catch (error) {
      if ((error as any).code === 'P2002') {
        return { success: false, error: 'You have already redeemed this coupon' };
      }
      throw error;
    }
  },

  async listCoupons(options?: { includeInactive?: boolean }) {
    const where = options?.includeInactive ? {} : { isActive: true };

    return prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { redemptions: true },
        },
      },
    });
  },

  async getCouponById(id: string) {
    return prisma.coupon.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        redemptions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { redeemedAt: 'desc' },
        },
        _count: {
          select: { redemptions: true },
        },
      },
    });
  },

  async deactivateCoupon(id: string) {
    try {
      return await prisma.coupon.update({
        where: { id },
        data: { isActive: false },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { redemptions: true },
          },
        },
      });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return null;
      }
      throw error;
    }
  },

  async activateCoupon(id: string) {
    try {
      return await prisma.coupon.update({
        where: { id },
        data: { isActive: true },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { redemptions: true },
          },
        },
      });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return null;
      }
      throw error;
    }
  },

  async deleteCoupon(id: string) {
    try {
      // Check if coupon has redemptions
      const coupon = await prisma.coupon.findUnique({
        where: { id },
        include: { _count: { select: { redemptions: true } } },
      });

      if (!coupon) {
        return { success: false, error: 'Coupon not found' };
      }

      if (coupon._count.redemptions > 0) {
        return {
          success: false,
          error: 'Cannot delete coupon with existing redemptions. Deactivate it instead.',
        };
      }

      await prisma.coupon.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return { success: false, error: 'Coupon not found' };
      }
      throw error;
    }
  },

  async getCouponStats() {
    const [totalCoupons, activeCoupons, totalRedemptions, creditStats] = await Promise.all([
      prisma.coupon.count(),
      prisma.coupon.count({ where: { isActive: true } }),
      prisma.couponRedemption.count(),
      prisma.creditTransaction.aggregate({
        where: { type: 'COUPON_REDEMPTION' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalCoupons,
      activeCoupons,
      totalRedemptions,
      totalCreditsDistributed: creditStats._sum.amount ?? 0,
    };
  },
};
