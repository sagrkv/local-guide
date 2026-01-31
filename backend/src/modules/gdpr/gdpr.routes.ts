import { FastifyInstance } from 'fastify';
import { gdprService, GdprAuditActions } from './gdpr.service.js';
import { auditService, AuditResources } from '../audit/audit.service.js';

export async function gdprRoutes(fastify: FastifyInstance) {
  // All GDPR routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * GET /api/user/export
   * Export all personal data as JSON for GDPR compliance
   */
  fastify.get('/export', async (request, reply) => {
    const userId = request.user.userId;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    try {
      const exportData = await gdprService.exportUserData(userId);

      if (!exportData) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Log the export request in audit trail
      await auditService.logAction({
        userId,
        action: GdprAuditActions.DATA_EXPORT_REQUESTED,
        resource: AuditResources.USER,
        resourceId: userId,
        details: {
          leadsCount: exportData.leads.length,
          scrapeJobsCount: exportData.scrapeJobs.length,
          activitiesCount: exportData.activities.length,
          creditTransactionsCount: exportData.creditTransactions.length,
        },
        ipAddress,
        userAgent,
        success: true,
      });

      // Set headers for file download
      reply.header('Content-Type', 'application/json');
      reply.header(
        'Content-Disposition',
        `attachment; filename="boko-data-export-${new Date().toISOString().split('T')[0]}.json"`
      );

      return exportData;
    } catch (error) {
      await auditService.logAction({
        userId,
        action: GdprAuditActions.DATA_EXPORT_REQUESTED,
        resource: AuditResources.USER,
        resourceId: userId,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: (error as Error).message,
      });

      throw error;
    }
  });

  /**
   * GET /api/user/delete/status
   * Get current deletion status
   */
  fastify.get('/delete/status', async (request, reply) => {
    const userId = request.user.userId;

    const status = await gdprService.getDeletionStatus(userId);

    if (!status) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return status;
  });

  /**
   * POST /api/user/delete
   * Request account deletion with 30-day grace period
   */
  fastify.post('/delete', async (request, reply) => {
    const userId = request.user.userId;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    try {
      const result = await gdprService.requestDeletion(userId);

      if (!result) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Log the deletion request in audit trail
      await auditService.logAction({
        userId,
        action: GdprAuditActions.DELETION_REQUESTED,
        resource: AuditResources.USER,
        resourceId: userId,
        details: {
          deletionDate: result.deletionDate.toISOString(),
          gracePeriodDays: result.gracePeriodDays,
        },
        ipAddress,
        userAgent,
        success: true,
      });

      return {
        message: 'Account deletion requested',
        deletionDate: result.deletionDate,
        gracePeriodDays: result.gracePeriodDays,
        info: `Your account will be permanently deleted on ${result.deletionDate.toLocaleDateString()}. You can cancel this request anytime before then.`,
      };
    } catch (error) {
      await auditService.logAction({
        userId,
        action: GdprAuditActions.DELETION_REQUESTED,
        resource: AuditResources.USER,
        resourceId: userId,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: (error as Error).message,
      });

      throw error;
    }
  });

  /**
   * DELETE /api/user/delete
   * Cancel a pending deletion request
   */
  fastify.delete('/delete', async (request, reply) => {
    const userId = request.user.userId;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    try {
      const cancelled = await gdprService.cancelDeletion(userId);

      if (!cancelled) {
        // Log failed cancellation attempt
        await auditService.logAction({
          userId,
          action: GdprAuditActions.DELETION_CANCELLED,
          resource: AuditResources.USER,
          resourceId: userId,
          ipAddress,
          userAgent,
          success: false,
          errorMessage: 'No pending deletion request found or grace period expired',
        });

        return reply.status(400).send({
          error: 'No pending deletion request found or grace period has already expired',
        });
      }

      // Log successful cancellation
      await auditService.logAction({
        userId,
        action: GdprAuditActions.DELETION_CANCELLED,
        resource: AuditResources.USER,
        resourceId: userId,
        ipAddress,
        userAgent,
        success: true,
      });

      return {
        message: 'Account deletion request cancelled',
        info: 'Your account deletion has been cancelled. Your data is safe.',
      };
    } catch (error) {
      await auditService.logAction({
        userId,
        action: GdprAuditActions.DELETION_CANCELLED,
        resource: AuditResources.USER,
        resourceId: userId,
        ipAddress,
        userAgent,
        success: false,
        errorMessage: (error as Error).message,
      });

      throw error;
    }
  });
}
