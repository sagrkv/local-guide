import { prisma } from '../../lib/prisma.js';
import { auditService, AuditActions, AuditResources } from '../audit/audit.service.js';

// Grace period in days before permanent deletion
const DELETION_GRACE_PERIOD_DAYS = 30;

export interface UserExportData {
  exportedAt: Date;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    creditBalance: number;
    createdAt: Date;
    updatedAt: Date;
    deleteRequestedAt: Date | null;
    deletedAt: Date | null;
    dataExportedAt: Date | null;
  };
  leads: Array<{
    id: string;
    businessName: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string;
    category: string;
    stage: string;
    priority: string;
    score: number;
    source: string;
    leadType: string;
    hasWebsite: boolean;
    lighthouseScore: number | null;
    notes: string | null;
    prospectStatus: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  scrapeJobs: Array<{
    id: string;
    type: string;
    query: string;
    location: string | null;
    category: string | null;
    status: string;
    leadsFound: number;
    leadsCreated: number;
    leadsDuplicate: number;
    leadsSkipped: number;
    createdAt: Date;
    completedAt: Date | null;
  }>;
  activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string | null;
    outcome: string | null;
    scheduledAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    leadId: string;
  }>;
  creditTransactions: Array<{
    id: string;
    amount: number;
    type: string;
    description: string | null;
    reference: string | null;
    createdAt: Date;
  }>;
}

export interface DeletionRequestResult {
  deletionDate: Date;
  gracePeriodDays: number;
}

export const gdprService = {
  /**
   * Export all user data for GDPR compliance
   * Excludes sensitive data like password hashes
   */
  async exportUserData(userId: string): Promise<UserExportData | null> {
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
        deleteRequestedAt: true,
        deletedAt: true,
        dataExportedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    // Fetch all user-owned data in parallel
    const [leads, scrapeJobs, activities, creditTransactions] = await Promise.all([
      prisma.lead.findMany({
        where: { userId },
        select: {
          id: true,
          businessName: true,
          contactPerson: true,
          email: true,
          phone: true,
          website: true,
          address: true,
          city: true,
          state: true,
          country: true,
          category: true,
          stage: true,
          priority: true,
          score: true,
          source: true,
          leadType: true,
          hasWebsite: true,
          lighthouseScore: true,
          notes: true,
          prospectStatus: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.scrapeJob.findMany({
        where: { createdById: userId },
        select: {
          id: true,
          type: true,
          query: true,
          location: true,
          category: true,
          status: true,
          leadsFound: true,
          leadsCreated: true,
          leadsDuplicate: true,
          leadsSkipped: true,
          createdAt: true,
          completedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activity.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          outcome: true,
          scheduledAt: true,
          completedAt: true,
          createdAt: true,
          leadId: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.creditTransaction.findMany({
        where: { userId },
        select: {
          id: true,
          amount: true,
          type: true,
          description: true,
          reference: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Update the dataExportedAt timestamp
    await prisma.user.update({
      where: { id: userId },
      data: { dataExportedAt: new Date() },
    });

    return {
      exportedAt: new Date(),
      user,
      leads,
      scrapeJobs,
      activities,
      creditTransactions,
    };
  },

  /**
   * Request account deletion with 30-day grace period
   * User can still login during grace period and cancel the request
   */
  async requestDeletion(userId: string): Promise<DeletionRequestResult | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deleteRequestedAt: true },
    });

    if (!user) {
      return null;
    }

    // Check if deletion is already requested
    if (user.deleteRequestedAt) {
      const deletionDate = new Date(user.deleteRequestedAt);
      deletionDate.setDate(deletionDate.getDate() + DELETION_GRACE_PERIOD_DAYS);
      return {
        deletionDate,
        gracePeriodDays: DELETION_GRACE_PERIOD_DAYS,
      };
    }

    const now = new Date();
    const deletionDate = new Date(now);
    deletionDate.setDate(deletionDate.getDate() + DELETION_GRACE_PERIOD_DAYS);

    await prisma.user.update({
      where: { id: userId },
      data: {
        deleteRequestedAt: now,
        deletedAt: deletionDate,
      },
    });

    return {
      deletionDate,
      gracePeriodDays: DELETION_GRACE_PERIOD_DAYS,
    };
  },

  /**
   * Cancel a pending deletion request
   * Only works during the grace period
   */
  async cancelDeletion(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deleteRequestedAt: true, deletedAt: true },
    });

    if (!user) {
      return false;
    }

    // Check if there's a pending deletion request
    if (!user.deleteRequestedAt) {
      return false;
    }

    // Ensure we're still within the grace period (deletedAt is in the future)
    if (user.deletedAt && user.deletedAt <= new Date()) {
      return false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deleteRequestedAt: null,
        deletedAt: null,
      },
    });

    return true;
  },

  /**
   * Check if user has a pending deletion request
   */
  async getDeletionStatus(userId: string): Promise<{
    hasPendingDeletion: boolean;
    deleteRequestedAt: Date | null;
    deletionDate: Date | null;
    daysRemaining: number | null;
  } | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        deleteRequestedAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    if (!user.deleteRequestedAt || !user.deletedAt) {
      return {
        hasPendingDeletion: false,
        deleteRequestedAt: null,
        deletionDate: null,
        daysRemaining: null,
      };
    }

    const now = new Date();
    const daysRemaining = Math.max(
      0,
      Math.ceil((user.deletedAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      hasPendingDeletion: true,
      deleteRequestedAt: user.deleteRequestedAt,
      deletionDate: user.deletedAt,
      daysRemaining,
    };
  },

  /**
   * Hard delete all user data
   * This should only be called after the grace period expires
   * Use with caution - this action is irreversible
   */
  async deleteUserData(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true },
    });

    if (!user) {
      return false;
    }

    // Safety check: ensure grace period has passed
    if (!user.deletedAt || user.deletedAt > new Date()) {
      throw new Error('Cannot delete user data: grace period has not expired');
    }

    // Delete all user data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete credit transactions
      await tx.creditTransaction.deleteMany({ where: { userId } });

      // Delete coupon redemptions
      await tx.couponRedemption.deleteMany({ where: { userId } });

      // Delete activities (must be before leads due to foreign key)
      await tx.activity.deleteMany({ where: { userId } });

      // Delete tag associations for user's leads
      const userLeadIds = await tx.lead.findMany({
        where: { userId },
        select: { id: true },
      });
      if (userLeadIds.length > 0) {
        await tx.tagOnLead.deleteMany({
          where: { leadId: { in: userLeadIds.map((l) => l.id) } },
        });
      }

      // Delete leads owned by user
      await tx.lead.deleteMany({ where: { userId } });

      // Delete scrape jobs
      await tx.scrapeJob.deleteMany({ where: { createdById: userId } });

      // Delete audit logs (keep for compliance but anonymize)
      await tx.auditLog.updateMany({
        where: { userId },
        data: { userId: null },
      });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    return true;
  },

  /**
   * Get users with expired grace periods for scheduled deletion
   * This should be called by a cron job to process deletions
   */
  async getUsersPendingDeletion(): Promise<Array<{ id: string; email: string; deletedAt: Date }>> {
    const users = await prisma.user.findMany({
      where: {
        deleteRequestedAt: { not: null },
        deletedAt: { lte: new Date() },
      },
      select: {
        id: true,
        email: true,
        deletedAt: true,
      },
    });

    return users.filter((u) => u.deletedAt !== null) as Array<{
      id: string;
      email: string;
      deletedAt: Date;
    }>;
  },
};

// Extend AuditActions with GDPR-specific actions
export const GdprAuditActions = {
  ...AuditActions,
  DATA_EXPORT_REQUESTED: 'DATA_EXPORT_REQUESTED',
  DELETION_REQUESTED: 'DELETION_REQUESTED',
  DELETION_CANCELLED: 'DELETION_CANCELLED',
  USER_DATA_DELETED: 'USER_DATA_DELETED',
} as const;
