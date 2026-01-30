import { prisma } from '../../lib/prisma.js';
import { CreditTransactionType } from '@prisma/client';

interface ListUsersParams {
  search?: string;
  page: number;
  limit: number;
}

interface UserWithStats {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  creditBalance: number;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    ownedLeads: number;
    scrapeJobs: number;
    creditTransactions: number;
  };
}

interface UserDetails extends UserWithStats {
  recentTransactions: {
    id: string;
    amount: number;
    type: string;
    description: string | null;
    reference: string | null;
    createdAt: Date;
  }[];
  recentScrapeJobs: {
    id: string;
    type: string;
    query: string;
    status: string;
    leadsCreated: number;
    createdAt: Date;
  }[];
}

interface UpdateUserData {
  creditBalance?: number;
  isActive?: boolean;
  name?: string;
  role?: 'ADMIN' | 'SALES_REP';
}

export const adminUsersService = {
  /**
   * List all users with stats (paginated)
   */
  async listUsers(params: ListUsersParams): Promise<{
    users: UserWithStats[];
    total: number;
  }> {
    const { search, page, limit } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          creditBalance: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              ownedLeads: true,
              scrapeJobs: true,
              creditTransactions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  },

  /**
   * Get user details with recent activity
   */
  async getUserDetails(userId: string): Promise<UserDetails | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        creditBalance: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ownedLeads: true,
            scrapeJobs: true,
            creditTransactions: true,
          },
        },
        creditTransactions: {
          select: {
            id: true,
            amount: true,
            type: true,
            description: true,
            reference: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        scrapeJobs: {
          select: {
            id: true,
            type: true,
            query: true,
            status: true,
            leadsCreated: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      recentTransactions: user.creditTransactions,
      recentScrapeJobs: user.scrapeJobs,
    };
  },

  /**
   * Update user details (admin action)
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<UserWithStats | null> {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return null;
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    if (data.creditBalance !== undefined) {
      updateData.creditBalance = data.creditBalance;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        creditBalance: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            ownedLeads: true,
            scrapeJobs: true,
            creditTransactions: true,
          },
        },
      },
    });

    return user;
  },

  /**
   * Add credits to user (admin action with audit trail)
   */
  async addCredits(
    userId: string,
    amount: number,
    reason: string,
    adminUserId: string
  ): Promise<{ newBalance: number } | null> {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return null;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update user balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          creditBalance: {
            increment: amount,
          },
        },
        select: { creditBalance: true },
      });

      // Create transaction record
      await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          type: CreditTransactionType.ADMIN_ADJUSTMENT,
          description: reason,
          reference: `admin:${adminUserId}`,
        },
      });

      return updatedUser.creditBalance;
    });

    return { newBalance: result };
  },

  /**
   * Deduct credits from user (admin action with audit trail)
   */
  async deductCredits(
    userId: string,
    amount: number,
    reason: string,
    adminUserId: string
  ): Promise<{ newBalance: number } | null> {
    if (amount <= 0) {
      throw new Error('Deduction amount must be positive');
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return null;
    }

    if (existingUser.creditBalance < amount) {
      throw new Error('Insufficient credits');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update user balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          creditBalance: {
            decrement: amount,
          },
        },
        select: { creditBalance: true },
      });

      // Create transaction record
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: CreditTransactionType.ADMIN_ADJUSTMENT,
          description: reason,
          reference: `admin:${adminUserId}`,
        },
      });

      return updatedUser.creditBalance;
    });

    return { newBalance: result };
  },
};
