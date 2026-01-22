import { ActivityType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

interface ListParams {
  page: number;
  limit: number;
  leadId?: string;
  type?: ActivityType;
  userId?: string;
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
  async list(params: ListParams) {
    const { page, limit, ...filters } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ActivityWhereInput = {};

    if (filters.leadId) where.leadId = filters.leadId;
    if (filters.type) where.type = filters.type;
    if (filters.userId) where.userId = filters.userId;
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

  async getById(id: string) {
    return prisma.activity.findUnique({
      where: { id },
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

  async update(id: string, data: UpdateActivityData) {
    const { scheduledAt, completedAt, ...rest } = data;

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

  async complete(id: string, outcome?: string) {
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

  async delete(id: string) {
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

  async getUpcomingForUser(userId: string, days = 7) {
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
          select: { id: true, businessName: true, contactPerson: true, phone: true },
        },
      },
    });
  },
};
