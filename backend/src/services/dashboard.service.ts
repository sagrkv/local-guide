import { prisma } from "../lib/prisma.js";

export async function getDashboardStats() {
  const [
    totalCities,
    totalPois,
    totalUsers,
    totalItineraries,
    pendingPois,
    recentActivity,
  ] = await Promise.all([
    prisma.city.count(),
    prisma.pOI.count(),
    prisma.user.count(),
    prisma.itinerary.count(),
    prisma.pOI.count({ where: { curationStatus: "PENDING" } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return {
    totalCities,
    totalPois,
    totalUsers,
    totalItineraries,
    pendingPois,
    recentActivity,
  };
}
