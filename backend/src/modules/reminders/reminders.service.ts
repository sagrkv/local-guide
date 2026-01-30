import { ReminderStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

interface ListRemindersParams {
  userId: string;
  status?: ReminderStatus;
  leadId?: string;
  page?: number;
  limit?: number;
}

interface CreateReminderData {
  userId: string;
  leadId: string;
  remindAt: Date;
  note?: string;
}

interface UpdateReminderData {
  remindAt?: Date;
  note?: string;
  status?: ReminderStatus;
}

export const remindersService = {
  /**
   * List reminders for a user with optional filters
   * CRITICAL: Always filter by userId for multi-tenancy
   */
  async list(params: ListRemindersParams) {
    const { userId, status, leadId, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
      ...(leadId && { leadId }),
    };

    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { remindAt: "asc" },
        include: {
          lead: {
            select: {
              id: true,
              businessName: true,
              email: true,
              phone: true,
              city: true,
              stage: true,
            },
          },
        },
      }),
      prisma.reminder.count({ where }),
    ]);

    return {
      data: reminders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get reminders due today for a user
   * Returns PENDING reminders where remindAt is today or earlier
   */
  async getDueReminders(userId: string) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        status: ReminderStatus.PENDING,
        remindAt: { lte: endOfDay },
      },
      orderBy: { remindAt: "asc" },
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            email: true,
            phone: true,
            city: true,
            stage: true,
          },
        },
      },
    });

    return reminders;
  },

  /**
   * Get count of due reminders for dashboard widget
   */
  async getDueRemindersCount(userId: string) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await prisma.reminder.count({
      where: {
        userId,
        status: ReminderStatus.PENDING,
        remindAt: { lte: endOfDay },
      },
    });

    return count;
  },

  /**
   * Get a single reminder by ID
   * CRITICAL: Verify ownership before returning
   */
  async getById(id: string, userId: string) {
    const reminder = await prisma.reminder.findFirst({
      where: { id, userId },
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            email: true,
            phone: true,
            city: true,
            stage: true,
          },
        },
      },
    });

    return reminder;
  },

  /**
   * Get reminders for a specific lead
   * CRITICAL: Verify lead ownership before returning
   */
  async getByLeadId(leadId: string, userId: string) {
    // First verify the lead belongs to this user
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      select: { id: true },
    });

    if (!lead) {
      return null;
    }

    const reminders = await prisma.reminder.findMany({
      where: { leadId, userId },
      orderBy: { remindAt: "asc" },
    });

    return reminders;
  },

  /**
   * Create a new reminder
   * CRITICAL: Verify lead ownership before creating
   */
  async create(data: CreateReminderData) {
    const { userId, leadId, remindAt, note } = data;

    // Verify the lead belongs to this user
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      select: { id: true },
    });

    if (!lead) {
      return null;
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId,
        leadId,
        remindAt,
        note,
      },
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            email: true,
            phone: true,
            city: true,
            stage: true,
          },
        },
      },
    });

    return reminder;
  },

  /**
   * Update a reminder
   * CRITICAL: Verify ownership before updating
   */
  async update(id: string, userId: string, data: UpdateReminderData) {
    // Verify ownership
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        ...(data.remindAt && { remindAt: data.remindAt }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.status && { status: data.status }),
      },
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            email: true,
            phone: true,
            city: true,
            stage: true,
          },
        },
      },
    });

    return reminder;
  },

  /**
   * Mark a reminder as completed
   */
  async complete(id: string, userId: string) {
    return this.update(id, userId, { status: ReminderStatus.COMPLETED });
  },

  /**
   * Dismiss a reminder
   */
  async dismiss(id: string, userId: string) {
    return this.update(id, userId, { status: ReminderStatus.DISMISSED });
  },

  /**
   * Delete a reminder
   * CRITICAL: Verify ownership before deleting
   */
  async delete(id: string, userId: string) {
    // Verify ownership
    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return false;
    }

    await prisma.reminder.delete({ where: { id } });
    return true;
  },
};
