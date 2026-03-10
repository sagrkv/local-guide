import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../plugins/clerk-auth.js";
import { requireRole } from "../../../middleware/require-role.js";
import { queryAuditLogs } from "../../../services/audit.service.js";
import { successList } from "../../../lib/response.js";

export default async function adminAuditLogRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);
  fastify.addHook("preHandler", requireRole("SUPER_ADMIN"));

  fastify.get("/audit-logs", async (request, reply) => {
    const { entity, entityId, userId, page, pageSize } = request.query as {
      entity?: string;
      entityId?: string;
      userId?: string;
      page?: number;
      pageSize?: number;
    };

    const result = await queryAuditLogs({
      entity,
      entityId,
      userId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return reply.send(
      successList(result.data, result.total, result.page, result.pageSize)
    );
  });
}
