import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { placesService } from './places.service.js';
import { success, error, ErrorCodes } from '../../lib/response.js';

const searchSchema = z.object({
  query: z.string().min(1),
  bounds: z.object({
    northLat: z.number(),
    southLat: z.number(),
    eastLng: z.number(),
    westLng: z.number(),
  }),
});

export async function placesRoutes(fastify: FastifyInstance) {
  // All places routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // POST /places/search — search places
  fastify.post('/places/search', async (request, reply) => {
    try {
      const data = searchSchema.parse(request.body);

      const result = await placesService.searchPlaces(data.query, {
        northLat: data.bounds.northLat,
        southLat: data.bounds.southLat,
        eastLng: data.bounds.eastLng,
        westLng: data.bounds.westLng,
      });

      return success(result.results, result.isMock ? { warning: 'Using mock data - GOOGLE_PLACES_API_KEY not configured' } : undefined);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });

  // GET /places/:placeId — get place details
  fastify.get('/places/:placeId', async (request, reply) => {
    try {
      const { placeId } = request.params as { placeId: string };

      const result = await placesService.getPlaceDetails(placeId);

      return success(result.place, result.isMock ? { warning: 'Using mock data - GOOGLE_PLACES_API_KEY not configured' } : undefined);
    } catch (err) {
      throw err;
    }
  });
}
