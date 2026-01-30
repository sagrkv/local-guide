import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prospectsService } from "./prospects.service.js";

const listQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50),
  scrapeJobId: z.string().optional(),
  city: z.string().optional(),
  category: z.string().optional(),
  hasWebsite: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  minScore: z.coerce.number().optional(),
  maxScore: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "score", "businessName", "city"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const bulkIdsSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID required"),
  reason: z.string().optional(),
});

export async function prospectsRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  // List prospects with filtering and pagination
  fastify.get("/", async (request) => {
    const query = listQuerySchema.parse(request.query);
    // Multi-tenancy: pass userId for data isolation
    return prospectsService.list({ ...query, userId: request.user.userId });
  });

  // Get stats
  fastify.get("/stats", async (request) => {
    // Multi-tenancy: pass userId for data isolation
    return prospectsService.getStats(request.user.userId);
  });

  // Get unique cities for filter dropdown
  fastify.get("/cities", async (request) => {
    // Multi-tenancy: pass userId for data isolation
    return prospectsService.getCities(request.user.userId);
  });

  // Get single prospect
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    // Multi-tenancy: pass userId for data isolation (returns null if not owned)
    const prospect = await prospectsService.getById(id, request.user.userId);
    if (!prospect) {
      return reply.status(404).send({ error: "Prospect not found" });
    }
    return prospect;
  });

  // Promote single prospect to lead
  fastify.post("/:id/promote", async (request, reply) => {
    const { id } = request.params as { id: string };
    // Multi-tenancy: service verifies ownership
    const lead = await prospectsService.promote(id, request.user.userId);
    if (!lead) {
      return reply.status(404).send({ error: "Prospect not found" });
    }
    return lead;
  });

  // Mark single prospect as not interested
  fastify.post("/:id/not-interested", async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { reason?: string } | undefined;
    // Multi-tenancy: service verifies ownership
    const prospect = await prospectsService.markNotInterested(
      id,
      request.user.userId,
      body?.reason
    );
    if (!prospect) {
      return reply.status(404).send({ error: "Prospect not found" });
    }
    return prospect;
  });

  // Archive single prospect (soft delete)
  fastify.post("/:id/archive", async (request, reply) => {
    const { id } = request.params as { id: string };
    // Multi-tenancy: service verifies ownership
    const prospect = await prospectsService.archive(id, request.user.userId);
    if (!prospect) {
      return reply.status(404).send({ error: "Prospect not found" });
    }
    return prospect;
  });

  // Delete single prospect (hard delete)
  fastify.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    // Multi-tenancy: service verifies ownership
    const result = await prospectsService.delete(id, request.user.userId);
    if (!result) {
      return reply.status(404).send({ error: "Prospect not found" });
    }
    return { message: "Prospect deleted" };
  });

  // Bulk promote prospects to leads
  fastify.post("/bulk/promote", async (request) => {
    const { ids } = bulkIdsSchema.parse(request.body);
    // Multi-tenancy: service only updates this user's prospects
    const result = await prospectsService.bulkPromote(ids, request.user.userId);
    return { count: result.count };
  });

  // Bulk delete prospects
  fastify.post("/bulk/delete", async (request) => {
    const { ids } = bulkIdsSchema.parse(request.body);
    // Multi-tenancy: service only deletes this user's prospects
    const result = await prospectsService.bulkDelete(ids, request.user.userId);
    return { count: result.count };
  });

  // Bulk mark not interested
  fastify.post("/bulk/not-interested", async (request) => {
    const { ids, reason } = bulkIdsSchema.parse(request.body);
    // Multi-tenancy: service only updates this user's prospects
    const result = await prospectsService.bulkMarkNotInterested(ids, request.user.userId, reason);
    return { count: result.count };
  });
}
