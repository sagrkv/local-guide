import { FastifyInstance } from "fastify";
import { z } from "zod";
import { remindersService } from "./reminders.service.js";

const createReminderSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  remindAt: z.string().datetime({ message: "Valid datetime is required" }),
  note: z.string().max(500).optional(),
});

const updateReminderSchema = z.object({
  remindAt: z.string().datetime().optional(),
  note: z.string().max(500).optional(),
  status: z.enum(["PENDING", "COMPLETED", "DISMISSED"]).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(["PENDING", "COMPLETED", "DISMISSED"]).optional(),
  leadId: z.string().optional(),
});

export async function remindersRoutes(fastify: FastifyInstance) {
  // Add auth to all routes
  fastify.addHook("preHandler", fastify.authenticate);

  /**
   * GET /api/reminders
   * List user's reminders with optional filters
   */
  fastify.get("/", async (request) => {
    const query = listQuerySchema.parse(request.query);

    const result = await remindersService.list({
      userId: request.user.userId,
      page: query.page,
      limit: query.limit,
      status: query.status as any,
      leadId: query.leadId,
    });

    return result;
  });

  /**
   * GET /api/reminders/due
   * Get reminders due today
   */
  fastify.get("/due", async (request) => {
    const reminders = await remindersService.getDueReminders(
      request.user.userId
    );

    return { data: reminders, count: reminders.length };
  });

  /**
   * GET /api/reminders/due/count
   * Get count of reminders due today (for dashboard widget)
   */
  fastify.get("/due/count", async (request) => {
    const count = await remindersService.getDueRemindersCount(
      request.user.userId
    );

    return { count };
  });

  /**
   * GET /api/reminders/:id
   * Get a single reminder
   */
  fastify.get("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const reminder = await remindersService.getById(id, request.user.userId);

    if (!reminder) {
      return reply.status(404).send({ error: "Reminder not found" });
    }

    return reminder;
  });

  /**
   * GET /api/reminders/lead/:leadId
   * Get all reminders for a specific lead
   */
  fastify.get("/lead/:leadId", async (request, reply) => {
    const { leadId } = request.params as { leadId: string };

    const reminders = await remindersService.getByLeadId(
      leadId,
      request.user.userId
    );

    if (reminders === null) {
      return reply.status(404).send({ error: "Lead not found" });
    }

    return { data: reminders };
  });

  /**
   * POST /api/reminders
   * Create a new reminder
   */
  fastify.post("/", async (request, reply) => {
    const data = createReminderSchema.parse(request.body);

    const reminder = await remindersService.create({
      userId: request.user.userId,
      leadId: data.leadId,
      remindAt: new Date(data.remindAt),
      note: data.note,
    });

    if (!reminder) {
      return reply.status(404).send({ error: "Lead not found" });
    }

    return reply.status(201).send(reminder);
  });

  /**
   * PUT /api/reminders/:id
   * Update a reminder (change date, note, or status)
   */
  fastify.put("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateReminderSchema.parse(request.body);

    const reminder = await remindersService.update(id, request.user.userId, {
      remindAt: data.remindAt ? new Date(data.remindAt) : undefined,
      note: data.note,
      status: data.status as any,
    });

    if (!reminder) {
      return reply.status(404).send({ error: "Reminder not found" });
    }

    return reminder;
  });

  /**
   * POST /api/reminders/:id/complete
   * Mark a reminder as completed
   */
  fastify.post("/:id/complete", async (request, reply) => {
    const { id } = request.params as { id: string };

    const reminder = await remindersService.complete(id, request.user.userId);

    if (!reminder) {
      return reply.status(404).send({ error: "Reminder not found" });
    }

    return reminder;
  });

  /**
   * POST /api/reminders/:id/dismiss
   * Dismiss a reminder
   */
  fastify.post("/:id/dismiss", async (request, reply) => {
    const { id } = request.params as { id: string };

    const reminder = await remindersService.dismiss(id, request.user.userId);

    if (!reminder) {
      return reply.status(404).send({ error: "Reminder not found" });
    }

    return reminder;
  });

  /**
   * DELETE /api/reminders/:id
   * Delete a reminder
   */
  fastify.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };

    const deleted = await remindersService.delete(id, request.user.userId);

    if (!deleted) {
      return reply.status(404).send({ error: "Reminder not found" });
    }

    return { message: "Reminder deleted successfully" };
  });
}
