import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { success, error, ErrorCodes } from '../../lib/response.js';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Sync endpoint — returns everything for offline use
// ---------------------------------------------------------------------------

export async function syncRoutes(fastify: FastifyInstance) {

  // GET /cities/:slug/sync
  fastify.get('/cities/:slug/sync', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    // Fetch city with theme
    const city = await prisma.city.findUnique({
      where: { slug },
      include: { theme: true },
    });

    if (!city) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'City not found'));
    }

    // Fetch all PUBLISHED data in parallel
    const [categories, tags, pois, itineraries, collections] = await Promise.all([
      // Categories for this city (global + city-specific)
      prisma.category.findMany({
        where: {
          OR: [
            { isGlobal: true },
            { cityId: city.id },
          ],
        },
        orderBy: { sortOrder: 'asc' },
      }),

      // All tags
      prisma.tag.findMany({
        orderBy: { name: 'asc' },
      }),

      // Published POIs with photos, tags, category
      prisma.pOI.findMany({
        where: { cityId: city.id, status: 'PUBLISHED' },
        include: {
          photos: { orderBy: { sortOrder: 'asc' } },
          tags: { include: { tag: true } },
          category: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),

      // Published itineraries with stops
      prisma.itinerary.findMany({
        where: { cityId: city.id, status: 'PUBLISHED' },
        include: {
          stops: {
            include: {
              poi: {
                select: { name: true, slug: true, latitude: true, longitude: true },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      }),

      // Published collections with items
      prisma.collection.findMany({
        where: { cityId: city.id, status: 'PUBLISHED' },
        include: {
          items: {
            include: {
              poi: {
                select: { name: true, slug: true, latitude: true, longitude: true },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      }),
    ]);

    const syncedAt = new Date().toISOString();

    // Compute ETag from latest updatedAt across all entities
    const allTimestamps: Date[] = [
      city.updatedAt,
      ...(city.theme ? [city.theme.updatedAt] : []),
      ...categories.map((c) => c.updatedAt),
      ...tags.map((t) => t.updatedAt),
      ...pois.map((p) => p.updatedAt),
      ...pois.flatMap((p) => p.photos.map((ph) => ph.updatedAt)),
      ...itineraries.map((i) => i.updatedAt),
      ...itineraries.flatMap((i) => i.stops.map((s) => s.updatedAt)),
      ...collections.map((c) => c.updatedAt),
      ...collections.flatMap((c) => c.items.map((ci) => ci.updatedAt)),
    ];

    const latestTimestamp = allTimestamps.reduce(
      (latest, ts) => (ts > latest ? ts : latest),
      new Date(0),
    );

    const etag = `"${crypto.createHash('md5').update(latestTimestamp.toISOString()).digest('hex')}"`;

    // Check If-None-Match
    const ifNoneMatch = request.headers['if-none-match'];
    if (ifNoneMatch === etag) {
      reply.status(304);
      return;
    }

    reply.header('ETag', etag);
    reply.header('Cache-Control', 'private, max-age=60');

    return success({
      city: { ...city, theme: city.theme },
      categories,
      tags,
      pois: pois.map((poi) => ({
        ...poi,
        photos: poi.photos,
        tags: poi.tags,
        category: poi.category,
      })),
      itineraries: itineraries.map((itin) => ({
        ...itin,
        stops: itin.stops.map((stop) => ({
          ...stop,
          poi: stop.poi,
        })),
      })),
      collections: collections.map((col) => ({
        ...col,
        items: col.items.map((item) => ({
          ...item,
          poi: item.poi,
        })),
      })),
      syncedAt,
    });
  });
}
