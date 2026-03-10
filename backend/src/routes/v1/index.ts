import { FastifyInstance } from "fastify";
import adminDashboardRoutes from "./admin/dashboard.js";
import adminUsersRoutes from "./admin/users.js";
import adminAuditLogRoutes from "./admin/audit-logs.js";

export default async function v1Routes(fastify: FastifyInstance) {
  // Admin routes
  await fastify.register(adminDashboardRoutes, { prefix: "/admin" });
  await fastify.register(adminUsersRoutes, { prefix: "/admin" });
  await fastify.register(adminAuditLogRoutes, { prefix: "/admin" });
}
