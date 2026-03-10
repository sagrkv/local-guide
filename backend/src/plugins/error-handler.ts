import { FastifyInstance, FastifyError } from "fastify";
import fp from "fastify-plugin";
import { AppError } from "../lib/errors.js";
import { errorResponse } from "../lib/response.js";

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    if (error instanceof AppError) {
      return reply
        .status(error.statusCode)
        .send(errorResponse(error.code, error.message, error.details));
    }

    // Fastify validation errors
    if (error.validation) {
      return reply
        .status(400)
        .send(errorResponse("VALIDATION_ERROR", "Invalid request", error.validation));
    }

    // Rate limit errors
    if (error.statusCode === 429) {
      return reply
        .status(429)
        .send(errorResponse("RATE_LIMITED", "Too many requests"));
    }

    // Unknown errors
    const statusCode = error.statusCode ?? 500;
    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message;

    return reply
      .status(statusCode)
      .send(errorResponse("INTERNAL_ERROR", message));
  });
}

export default fp(errorHandlerPlugin, { name: "error-handler" });
