import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../plugins/clerk-auth.js";
import { requireRole } from "../../../middleware/require-role.js";
import { getDashboardStats } from "../../../services/dashboard.service.js";
import { success } from "../../../lib/response.js";

export default async function adminDashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);
  fastify.addHook("preHandler", requireRole("CITY_ADMIN"));

  fastify.get("/dashboard", async (_request, reply) => {
    const stats = await getDashboardStats();
    return reply.send(success(stats));
  });
}
