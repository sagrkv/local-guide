import { FastifyInstance } from 'fastify';
import { enrichmentService } from './enrichment.service.js';
import { success, error, ErrorCodes } from '../../lib/response.js';
import { auditService, AuditResources } from '../audit/audit.service.js';

export async function enrichmentRoutes(fastify: FastifyInstance) {
  // All enrichment routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /pois/:id/enrich — enrich single POI
  fastify.post('/pois/:id/enrich', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    try {
      const result = await enrichmentService.enrichPOI(id);

      await auditService.logAction({
        userId: user.userId,
        action: 'POI_ENRICHED',
        resource: AuditResources.POI,
        resourceId: id,
        details: { fieldsUpdated: result.fieldsUpdated },
      });

      return success(result);
    } catch (err) {
      if (err instanceof Error && err.message === 'ANTHROPIC_API_KEY is not configured') {
        return reply.status(500).send(error(ErrorCodes.INTERNAL_ERROR, 'ANTHROPIC_API_KEY is not configured'));
      }
      if (err instanceof Error && err.message === 'POI not found') {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
      }
      if (err instanceof Error && err.message.startsWith('Failed to parse AI response')) {
        return reply.status(500).send(error(ErrorCodes.INTERNAL_ERROR, err.message));
      }
      throw err;
    }
  });

  // POST /cities/:cityId/enrich-batch — enrich all AI_SUGGESTED POIs
  fastify.post('/cities/:cityId/enrich-batch', async (request, reply) => {
    const { cityId } = request.params as { cityId: string };
    const user = (request as any).user;

    try {
      const result = await enrichmentService.enrichBatch(cityId);

      await auditService.logAction({
        userId: user.userId,
        action: 'POI_BATCH_ENRICHED',
        resource: AuditResources.CITY,
        resourceId: cityId,
        details: { enriched: result.enriched, failed: result.failed, skipped: result.skipped },
      });

      return success(result);
    } catch (err) {
      if (err instanceof Error && err.message === 'ANTHROPIC_API_KEY is not configured') {
        return reply.status(500).send(error(ErrorCodes.INTERNAL_ERROR, 'ANTHROPIC_API_KEY is not configured'));
      }
      throw err;
    }
  });
}
