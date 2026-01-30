import { prisma } from '../../lib/prisma.js';

interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalLeads: number;
  totalProspects: number;
  totalCreditsUsed: number;
  totalCreditsAdded: number;
  activeJobs: number;
  completedJobs: number;
}

interface GrowthDataPoint {
  date: string;
  count: number;
}

interface CreditUsageDataPoint {
  date: string;
  used: number;
  added: number;
}

interface TopUser {
  id: string;
  name: string;
  email: string;
  leadsCount: number;
  creditsUsed: number;
}

export const adminAnalyticsService = {
  /**
   * Get overview statistics for the admin dashboard
   */
  async getOverviewStats(): Promise<OverviewStats> {
    const [
      totalUsers,
      activeUsers,
      totalLeads,
      totalProspects,
      creditsUsed,
      creditsAdded,
      activeJobs,
      completedJobs,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users
      prisma.user.count({ where: { isActive: true } }),

      // Total leads (promoted prospects)
      prisma.lead.count({ where: { prospectStatus: 'LEAD' } }),

      // Total prospects (all statuses)
      prisma.lead.count(),

      // Total credits used (negative transactions)
      prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: { amount: { lt: 0 } },
      }),

      // Total credits added (positive transactions)
      prisma.creditTransaction.aggregate({
        _sum: { amount: true },
        where: { amount: { gt: 0 } },
      }),

      // Active scrape jobs
      prisma.scrapeJob.count({
        where: { status: { in: ['PENDING', 'RUNNING'] } },
      }),

      // Completed scrape jobs
      prisma.scrapeJob.count({ where: { status: 'COMPLETED' } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalLeads,
      totalProspects,
      totalCreditsUsed: Math.abs(creditsUsed._sum.amount || 0),
      totalCreditsAdded: creditsAdded._sum.amount || 0,
      activeJobs,
      completedJobs,
    };
  },

  /**
   * Get user growth over time
   */
  async getUserGrowth(days: number = 30): Promise<GrowthDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all users created in the time range
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Get cumulative count before the start date
    const baseCount = await prisma.user.count({
      where: { createdAt: { lt: startDate } },
    });

    // Group by date
    const dateMap = new Map<string, number>();

    // Initialize all dates with 0
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    // Count users per date
    users.forEach((user) => {
      const dateStr = user.createdAt.toISOString().split('T')[0];
      const current = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, current + 1);
    });

    // Convert to cumulative counts
    const result: GrowthDataPoint[] = [];
    let cumulativeCount = baseCount;

    Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([date, count]) => {
        cumulativeCount += count;
        result.push({ date, count: cumulativeCount });
      });

    return result;
  },

  /**
   * Get credit usage over time
   */
  async getCreditUsage(days: number = 30): Promise<CreditUsageDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all transactions in the time range
    const transactions = await prisma.creditTransaction.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, { used: number; added: number }>();

    // Initialize all dates
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, { used: 0, added: 0 });
    }

    // Sum transactions per date
    transactions.forEach((tx) => {
      const dateStr = tx.createdAt.toISOString().split('T')[0];
      const current = dateMap.get(dateStr) || { used: 0, added: 0 };

      if (tx.amount < 0) {
        current.used += Math.abs(tx.amount);
      } else {
        current.added += tx.amount;
      }

      dateMap.set(dateStr, current);
    });

    // Convert to array
    return Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        used: data.used,
        added: data.added,
      }));
  },

  /**
   * Get lead creation over time
   */
  async getLeadGrowth(days: number = 30): Promise<GrowthDataPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get all leads created in the time range
    const leads = await prisma.lead.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, number>();

    // Initialize all dates
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    // Count leads per date
    leads.forEach((lead) => {
      const dateStr = lead.createdAt.toISOString().split('T')[0];
      const current = dateMap.get(dateStr) || 0;
      dateMap.set(dateStr, current + 1);
    });

    return Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  },

  /**
   * Get top users by lead count
   */
  async getTopUsersByLeads(limit: number = 10): Promise<TopUser[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            ownedLeads: true,
          },
        },
        creditTransactions: {
          where: { amount: { lt: 0 } },
          select: { amount: true },
        },
      },
      orderBy: {
        ownedLeads: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      leadsCount: user._count.ownedLeads,
      creditsUsed: user.creditTransactions.reduce(
        (sum, tx) => sum + Math.abs(tx.amount),
        0
      ),
    }));
  },

  /**
   * Get scrape job statistics
   */
  async getScrapeJobStats(days: number = 30): Promise<{
    totalJobs: number;
    successRate: number;
    avgLeadsPerJob: number;
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalJobs, completedJobs, avgLeads, byStatus, byType] =
      await Promise.all([
        // Total jobs
        prisma.scrapeJob.count({
          where: { createdAt: { gte: startDate } },
        }),

        // Completed jobs
        prisma.scrapeJob.count({
          where: {
            createdAt: { gte: startDate },
            status: 'COMPLETED',
          },
        }),

        // Average leads per completed job
        prisma.scrapeJob.aggregate({
          _avg: { leadsCreated: true },
          where: {
            createdAt: { gte: startDate },
            status: 'COMPLETED',
          },
        }),

        // Count by status
        prisma.scrapeJob.groupBy({
          by: ['status'],
          _count: { status: true },
          where: { createdAt: { gte: startDate } },
        }),

        // Count by type
        prisma.scrapeJob.groupBy({
          by: ['type'],
          _count: { type: true },
          where: { createdAt: { gte: startDate } },
        }),
      ]);

    return {
      totalJobs,
      successRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
      avgLeadsPerJob: avgLeads._avg.leadsCreated || 0,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      byType: byType.map((t) => ({
        type: t.type,
        count: t._count.type,
      })),
    };
  },

  /**
   * Get system-wide category distribution
   */
  async getCategoryDistribution(): Promise<{ category: string; count: number }[]> {
    const categories = await prisma.lead.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
    });

    return categories.map((c) => ({
      category: c.category,
      count: c._count.category,
    }));
  },

  /**
   * Get geographic distribution of leads
   */
  async getGeographicDistribution(): Promise<{
    cities: { city: string; count: number }[];
    states: { state: string; count: number }[];
  }> {
    const [cities, states] = await Promise.all([
      prisma.lead.groupBy({
        by: ['city'],
        _count: { city: true },
        where: { city: { not: null } },
        orderBy: { _count: { city: 'desc' } },
        take: 20,
      }),
      prisma.lead.groupBy({
        by: ['state'],
        _count: { state: true },
        where: { state: { not: null } },
        orderBy: { _count: { state: 'desc' } },
      }),
    ]);

    return {
      cities: cities.map((c) => ({
        city: c.city || 'Unknown',
        count: c._count.city,
      })),
      states: states.map((s) => ({
        state: s.state || 'Unknown',
        count: s._count.state,
      })),
    };
  },
};
