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
  role?: 'ADMIN' | 'USER';
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

  /**
   * Get user activity data for enhanced stats display
   * Includes 30-day activity, burn rate, last active, and API usage
   */
  async getUserActivity(userId: string): Promise<{
    activityTimeline: Array<{ date: string; scrapeJobs: number; leadsCreated: number; creditsUsed: number }>;
    creditBurnRate: { daily: number; weekly: number };
    lastActive: string | null;
    apiUsage: { total: number; last30Days: number };
  } | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get activity timeline (last 30 days)
    const scrapeJobsByDate = await prisma.scrapeJob.groupBy({
      by: ['createdAt'],
      where: {
        createdById: userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      _sum: { leadsCreated: true },
    });

    const creditsByDate = await prisma.creditTransaction.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
        amount: { lt: 0 }, // Only deductions (usage)
      },
      _sum: { amount: true },
    });

    // Build timeline for last 30 days
    const timeline: Array<{ date: string; scrapeJobs: number; leadsCreated: number; creditsUsed: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const jobsForDay = scrapeJobsByDate.filter(
        j => j.createdAt.toISOString().split('T')[0] === dateStr
      );
      const creditsForDay = creditsByDate.filter(
        c => c.createdAt.toISOString().split('T')[0] === dateStr
      );

      timeline.push({
        date: dateStr,
        scrapeJobs: jobsForDay.reduce((sum, j) => sum + j._count, 0),
        leadsCreated: jobsForDay.reduce((sum, j) => sum + (j._sum.leadsCreated || 0), 0),
        creditsUsed: Math.abs(creditsForDay.reduce((sum, c) => sum + (c._sum.amount || 0), 0)),
      });
    }

    // Calculate credit burn rate
    const last30DaysUsage = await prisma.creditTransaction.aggregate({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo },
        amount: { lt: 0 },
      },
      _sum: { amount: true },
    });

    const last7DaysUsage = await prisma.creditTransaction.aggregate({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
        amount: { lt: 0 },
      },
      _sum: { amount: true },
    });

    const dailyBurn = Math.abs(last30DaysUsage._sum.amount || 0) / 30;
    const weeklyBurn = Math.abs(last7DaysUsage._sum.amount || 0);

    // Get last active (most recent scrape job or transaction)
    const lastJob = await prisma.scrapeJob.findFirst({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const lastTransaction = await prisma.creditTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    let lastActive: string | null = null;
    if (lastJob && lastTransaction) {
      lastActive = lastJob.createdAt > lastTransaction.createdAt
        ? lastJob.createdAt.toISOString()
        : lastTransaction.createdAt.toISOString();
    } else if (lastJob) {
      lastActive = lastJob.createdAt.toISOString();
    } else if (lastTransaction) {
      lastActive = lastTransaction.createdAt.toISOString();
    }

    // Get API usage (from ApiCallLog if exists)
    let totalApiCalls = 0;
    let last30DaysApiCalls = 0;
    try {
      const apiCounts = await prisma.apiCallLog.aggregate({
        where: { scrapeJob: { createdById: userId } },
        _count: true,
      });
      totalApiCalls = apiCounts._count;

      const recentApiCounts = await prisma.apiCallLog.aggregate({
        where: {
          scrapeJob: { createdById: userId },
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: true,
      });
      last30DaysApiCalls = recentApiCounts._count;
    } catch {
      // ApiCallLog might not exist or have different structure
    }

    return {
      activityTimeline: timeline,
      creditBurnRate: {
        daily: Math.round(dailyBurn * 10) / 10,
        weekly: Math.round(weeklyBurn),
      },
      lastActive,
      apiUsage: {
        total: totalApiCalls,
        last30Days: last30DaysApiCalls,
      },
    };
  },
};
