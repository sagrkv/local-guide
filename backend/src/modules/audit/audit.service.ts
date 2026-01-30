import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

export interface LogActionParams {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export interface GetAuditLogsFilters {
  userId?: string;
  action?: string;
  resource?: string;
  dateFrom?: Date;
  dateTo?: Date;
  success?: boolean;
  page?: number;
  limit?: number;
}

export const auditService = {
  /**
   * Log an action to the audit trail
   * This method is fire-and-forget - errors are logged but don't throw
   */
  async logAction(params: LogActionParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          details: params.details as Prisma.InputJsonValue,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          success: params.success ?? true,
          errorMessage: params.errorMessage,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit logging should never break main flow
      console.error('Failed to create audit log:', error);
    }
  },

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(filters: GetAuditLogsFilters) {
    const {
      userId,
      action,
      resource,
      dateFrom,
      dateTo,
      success,
      page = 1,
      limit = 50,
    } = filters;

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (typeof success === 'boolean') {
      where.success = success;
    }

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        where.timestamp.gte = dateFrom;
      }
      if (dateTo) {
        where.timestamp.lte = dateTo;
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a single audit log by ID
   */
  async getById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  },

  /**
   * Get distinct action types for filtering UI
   */
  async getDistinctActions(): Promise<string[]> {
    const result = await prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
    });
    return result.map((r) => r.action);
  },

  /**
   * Get distinct resource types for filtering UI
   */
  async getDistinctResources(): Promise<string[]> {
    const result = await prisma.auditLog.findMany({
      distinct: ['resource'],
      select: { resource: true },
      orderBy: { resource: 'asc' },
    });
    return result.map((r) => r.resource);
  },
};

// Common audit actions - use these constants for consistency
export const AuditActions = {
  // Auth
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',

  // Leads
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_UPDATED: 'LEAD_UPDATED',
  LEAD_DELETED: 'LEAD_DELETED',
  LEAD_STAGE_CHANGED: 'LEAD_STAGE_CHANGED',
  LEAD_ASSIGNED: 'LEAD_ASSIGNED',
  LEAD_PROMOTED: 'LEAD_PROMOTED',

  // Scraping
  SCRAPE_JOB_CREATED: 'SCRAPE_JOB_CREATED',
  SCRAPE_JOB_STARTED: 'SCRAPE_JOB_STARTED',
  SCRAPE_JOB_COMPLETED: 'SCRAPE_JOB_COMPLETED',
  SCRAPE_JOB_FAILED: 'SCRAPE_JOB_FAILED',
  SCRAPE_JOB_CANCELLED: 'SCRAPE_JOB_CANCELLED',

  // Credits
  CREDITS_ADDED: 'CREDITS_ADDED',
  CREDITS_DEDUCTED: 'CREDITS_DEDUCTED',
  COUPON_REDEEMED: 'COUPON_REDEEMED',

  // Users
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_DELETED: 'USER_DELETED',
  USER_LINKED_TO_CLERK: 'USER_LINKED_TO_CLERK',

  // GDPR Compliance
  DATA_EXPORT_REQUESTED: 'DATA_EXPORT_REQUESTED',
  DELETION_REQUESTED: 'DELETION_REQUESTED',
  DELETION_CANCELLED: 'DELETION_CANCELLED',
  USER_DATA_DELETED: 'USER_DATA_DELETED',

  // Admin
  ADMIN_ACTION: 'ADMIN_ACTION',
} as const;

export const AuditResources = {
  USER: 'user',
  LEAD: 'lead',
  SCRAPE_JOB: 'scrape_job',
  CREDIT: 'credit',
  COUPON: 'coupon',
  TAG: 'tag',
  ACTIVITY: 'activity',
  CONTACT: 'contact',
  REGION: 'region',
} as const;
