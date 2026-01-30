import { prisma } from "../../lib/prisma.js";
import { ProspectStatus, ReminderStatus } from "@prisma/client";

export const dashboardService = {
  async getStats(userId: string) {
    // CRITICAL: All dashboard stats filtered by userId for multi-tenancy
    const userFilter = { userId };
    const leadFilter = { ...userFilter, prospectStatus: ProspectStatus.LEAD };

    // Get end of today for due reminders count
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalLeads,
      totalProspects,
      newLeads,
      closedLeads,
      activeScrapeJobs,
      totalActivities,
      dueRemindersCount,
    ] = await Promise.all([
      prisma.lead.count({ where: leadFilter }),
      prisma.lead.count({ where: { ...userFilter, prospectStatus: ProspectStatus.PROSPECT } }),
      prisma.lead.count({ where: { ...leadFilter, stage: "NEW" } }),
      prisma.lead.count({ where: { ...leadFilter, stage: "CLOSED" } }),
      prisma.scrapeJob.count({ where: { createdById: userId, status: "RUNNING" } }),
      prisma.activity.count({ where: { userId } }),
      prisma.reminder.count({
        where: {
          userId,
          status: ReminderStatus.PENDING,
          remindAt: { lte: endOfToday },
        },
      }),
    ]);

    // Calculate leads this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const leadsThisMonth = await prisma.lead.count({
      where: { ...leadFilter, createdAt: { gte: startOfMonth } },
    });

    // Calculate average score (only for leads)
    const avgScoreResult = await prisma.lead.aggregate({
      where: leadFilter,
      _avg: { score: true },
    });

    return {
      totalLeads,
      totalProspects, // New: count of raw prospects awaiting review
      newLeads,
      closedLeads, // Renamed from wonLeads to match new pipeline
      leadsThisMonth,
      activeScrapeJobs,
      totalActivities,
      averageScore: Math.round(avgScoreResult._avg.score || 0),
      dueRemindersCount, // Follow-up reminders due today
    };
  },

  async getPipelineCounts(userId: string) {
    // CRITICAL: Filter by userId for multi-tenancy
    const leadFilter = { userId, prospectStatus: ProspectStatus.LEAD };
    const stages = [
      "NEW",
      "CONTACTED",
      "INTERESTED",
      "CLOSED",
    ] as const;

    const counts = await prisma.lead.groupBy({
      by: ["stage"],
      where: leadFilter,
      _count: { id: true },
    });

    const pipeline = stages.map((stage) => ({
      stage,
      count: counts.find((c) => c.stage === stage)?._count.id || 0,
    }));

    return pipeline;
  },

  async getLeadsByCategory(userId: string) {
    // CRITICAL: Filter by userId for multi-tenancy
    const leadFilter = { userId, prospectStatus: ProspectStatus.LEAD };
    const categories = await prisma.lead.groupBy({
      by: ["category"],
      where: leadFilter,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    return categories.map((c) => ({
      category: c.category,
      count: c._count.id,
    }));
  },

  async getLeadsBySource(userId: string) {
    // CRITICAL: Filter by userId for multi-tenancy
    const leadFilter = { userId, prospectStatus: ProspectStatus.LEAD };
    const sources = await prisma.lead.groupBy({
      by: ["source"],
      where: leadFilter,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    return sources.map((s) => ({
      source: s.source,
      count: s._count.id,
    }));
  },

  async getRecentActivities(userId: string, limit = 10) {
    // CRITICAL: Filter by userId for multi-tenancy
    return prisma.activity.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        lead: {
          select: { id: true, businessName: true },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });
  },

  async getLeadsOverTime(userId: string, days = 30) {
    // CRITICAL: Filter by userId for multi-tenancy
    const leadFilter = { userId, prospectStatus: ProspectStatus.LEAD };
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const leads = await prisma.lead.findMany({
      where: { ...leadFilter, createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const grouped = new Map<string, number>();

    // Initialize all dates
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      grouped.set(dateStr, 0);
    }

    // Count leads per day
    leads.forEach((lead) => {
      const dateStr = lead.createdAt.toISOString().split("T")[0];
      grouped.set(dateStr, (grouped.get(dateStr) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  },

  async getTopPerformers(userId: string, limit = 5) {
    // CRITICAL: Filter by userId for multi-tenancy
    const leadFilter = { userId, prospectStatus: ProspectStatus.LEAD };
    const performers = await prisma.lead.groupBy({
      by: ["assignedToId"],
      where: {
        ...leadFilter,
        stage: "CLOSED",
        assignedToId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });

    // Get user details
    const userIds = performers
      .map((p) => p.assignedToId)
      .filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    return performers.map((p) => ({
      user: users.find((u) => u.id === p.assignedToId),
      wonCount: p._count.id,
    }));
  },

  async getConversionRates(userId: string) {
    // CRITICAL: Filter by userId for multi-tenancy
    const leadFilter = { userId, prospectStatus: ProspectStatus.LEAD };
    const [total, contacted, interested, closed] = await Promise.all([
      prisma.lead.count({ where: leadFilter }),
      prisma.lead.count({
        where: {
          ...leadFilter,
          stage: {
            in: ["CONTACTED", "INTERESTED", "CLOSED"],
          },
        },
      }),
      prisma.lead.count({
        where: {
          ...leadFilter,
          stage: { in: ["INTERESTED", "CLOSED"] },
        },
      }),
      prisma.lead.count({ where: { ...leadFilter, stage: "CLOSED" } }),
    ]);

    return {
      newToContacted: total > 0 ? Math.round((contacted / total) * 100) : 0,
      contactedToInterested:
        contacted > 0 ? Math.round((interested / contacted) * 100) : 0,
      interestedToClosed:
        interested > 0 ? Math.round((closed / interested) * 100) : 0,
      overallConversion: total > 0 ? Math.round((closed / total) * 100) : 0,
    };
  },
};
