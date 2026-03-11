import { prisma } from '../../lib/prisma.js';

interface OverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalCities: number;
  publishedCities: number;
  totalPOIs: number;
  publishedPOIs: number;
  totalItineraries: number;
  totalCollections: number;
}

interface GrowthDataPoint {
  date: string;
  count: number;
}

export const adminAnalyticsService = {
  /**
   * Get overview statistics for the admin dashboard
   */
  async getOverviewStats(): Promise<OverviewStats> {
    const [
      totalUsers,
      activeUsers,
      totalCities,
      publishedCities,
      totalPOIs,
      publishedPOIs,
      totalItineraries,
      totalCollections,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.city.count(),
      prisma.city.count({ where: { status: 'PUBLISHED' } }),
      prisma.pOI.count(),
      prisma.pOI.count({ where: { status: 'PUBLISHED' } }),
      prisma.itinerary.count(),
      prisma.collection.count(),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalCities,
      publishedCities,
      totalPOIs,
      publishedPOIs,
      totalItineraries,
      totalCollections,
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
};
