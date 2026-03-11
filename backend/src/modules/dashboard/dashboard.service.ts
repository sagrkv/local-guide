import { prisma } from "../../lib/prisma.js";

export const dashboardService = {
  /**
   * Get overview stats for the curator dashboard
   */
  async getStats(userId: string) {
    const [
      totalCities,
      totalPOIs,
      publishedPOIs,
      pendingReviewPOIs,
      totalItineraries,
      totalCollections,
    ] = await Promise.all([
      prisma.city.count(),
      prisma.pOI.count(),
      prisma.pOI.count({ where: { status: 'PUBLISHED' } }),
      prisma.pOI.count({ where: { status: { in: ['AI_SUGGESTED', 'UNDER_REVIEW'] } } }),
      prisma.itinerary.count(),
      prisma.collection.count(),
    ]);

    return {
      totalCities,
      totalPOIs,
      publishedPOIs,
      pendingReviewPOIs,
      totalItineraries,
      totalCollections,
    };
  },

  /**
   * Get POI counts by status
   */
  async getPOIStatusCounts(userId: string) {
    const counts = await prisma.pOI.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return counts.map((c) => ({
      status: c.status,
      count: c._count.id,
    }));
  },

  /**
   * Get POIs by category
   */
  async getPOIsByCategory(userId: string) {
    const categories = await prisma.pOI.groupBy({
      by: ['categoryId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Fetch category names
    const categoryIds = categories.map((c) => c.categoryId);
    const categoryRecords = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categoryRecords.map((c) => [c.id, c.name]));

    return categories.map((c) => ({
      category: categoryMap.get(c.categoryId) || 'Unknown',
      count: c._count.id,
    }));
  },

  /**
   * Get recent discovery jobs
   */
  async getRecentDiscoveryJobs(userId: string, limit = 10) {
    return prisma.discoveryJob.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        city: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });
  },
};
