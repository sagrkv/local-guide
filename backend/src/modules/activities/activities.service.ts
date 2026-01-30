import { ActivityType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

interface ListParams {
  page?: number;
  limit?: number;
  leadId?: string;
  type?: ActivityType;
  userId: string; // Required for multi-tenancy
  upcoming?: boolean;
}

interface CreateActivityData {
  leadId: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  outcome?: string;
  scheduledAt?: string;
}

interface UpdateActivityData {
  title?: string;
  description?: string;
  outcome?: string;
  scheduledAt?: string;
  completedAt?: string;
}

export const activitiesService = {
  /**
   * List activities with multi-tenancy enforcement
   * Users can only see their own activities
   */
  async list(params: ListParams) {
    const { page = 1, limit = 20, userId, ...filters } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityWhereInput = {
      userId, // Multi-tenancy: always filter by current user
    };

    if (filters.leadId) where.leadId = filters.leadId;
    if (filters.type) where.type = filters.type;
    if (filters.upcoming) {
      where.scheduledAt = { gte: new Date() };
      where.completedAt = null;
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: {
            select: { id: true, businessName: true, stage: true },
          },
          user: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    return {
      data: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get activity by ID with multi-tenancy check
   * Returns null if activity doesn't belong to user
   */
  async getById(id: string, userId: string) {
    return prisma.activity.findFirst({
      where: {
        id,
        userId, // Multi-tenancy: user can only access their own activities
      },
      include: {
        lead: {
          select: { id: true, businessName: true, stage: true, contactPerson: true, email: true, phone: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  async create(data: CreateActivityData) {
    const { scheduledAt, ...rest } = data;

    return prisma.activity.create({
      data: {
        ...rest,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
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

  /**
   * Update activity with multi-tenancy check
   * Only updates if activity belongs to the user
   */
  async update(id: string, userId: string, data: UpdateActivityData) {
    const { scheduledAt, completedAt, ...rest } = data;

    // First verify ownership
    const existing = await prisma.activity.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    try {
      return await prisma.activity.update({
        where: { id },
        data: {
          ...rest,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          completedAt: completedAt ? new Date(completedAt) : undefined,
        },
        include: {
          lead: {
            select: { id: true, businessName: true },
          },
          user: {
            select: { id: true, name: true },
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

  /**
   * Mark activity as complete with multi-tenancy check
   * Also updates the lead's lastContactedAt timestamp
   */
  async complete(id: string, userId: string, outcome?: string) {
    // First verify ownership
    const existing = await prisma.activity.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    try {
      const activity = await prisma.activity.update({
        where: { id },
        data: {
          completedAt: new Date(),
          outcome: outcome || undefined,
        },
        include: {
          lead: {
            select: { id: true, businessName: true },
          },
          user: {
            select: { id: true, name: true },
          },
        },
      });

      // Update lead's lastContactedAt
      await prisma.lead.update({
        where: { id: activity.leadId },
        data: { lastContactedAt: new Date() },
      });

      return activity;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return null;
      }
      throw error;
    }
  },

  /**
   * Delete activity with multi-tenancy check
   * Only deletes if activity belongs to the user
   */
  async delete(id: string, userId: string) {
    // First verify ownership
    const existing = await prisma.activity.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return false;
    }

    try {
      await prisma.activity.delete({ where: { id } });
      return true;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return false;
      }
      throw error;
    }
  },

  /**
   * Get upcoming tasks/activities for a user
   * Returns activities with scheduledAt in the future that are not completed
   */
  async getUpcomingTasks(userId: string, days = 7) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return prisma.activity.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: new Date(),
          lte: endDate,
        },
        completedAt: null,
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        lead: {
          select: { id: true, businessName: true, contactPerson: true, phone: true, email: true },
        },
      },
    });
  },

  /**
   * Get activities for a specific lead with multi-tenancy check
   * Convenience method for the nested route pattern
   */
  async getActivitiesByLead(userId: string, leadId: string, page = 1, limit = 50) {
    return this.list({
      userId,
      leadId,
      page,
      limit,
    });
  },

  /**
   * Create activity for a specific lead
   * CRITICAL: Validates that the lead exists AND belongs to the user (multi-tenancy)
   */
  async createActivity(
    userId: string,
    leadId: string,
    data: Omit<CreateActivityData, 'userId' | 'leadId'>
  ) {
    // CRITICAL: Verify the lead exists AND belongs to this user for multi-tenancy
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      select: { id: true },
    });

    if (!lead) {
      return null; // Return 404 to prevent enumeration attacks
    }

    return this.create({
      ...data,
      userId,
      leadId,
    });
  },
};
