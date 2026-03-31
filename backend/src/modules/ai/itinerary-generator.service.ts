import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateItineraryInput {
  citySlug: string;
  duration: '2-hours' | 'half-day' | 'full-day' | '2-days';
  interests: string[];
  startTime?: string;
  pace?: 'relaxed' | 'moderate' | 'packed';
}

export interface GeneratedStop {
  poiId: string;
  poiName: string;
  poiSlug: string;
  order: number;
  arrivalTime: string;
  duration: string;
  note: string;
  transportToNext?: string;
}

export interface GeneratedItinerary {
  title: string;
  description: string;
  totalDuration: string;
  stops: GeneratedStop[];
}

// ---------------------------------------------------------------------------
// Zod schema for Claude's JSON response
// ---------------------------------------------------------------------------

const stopSchema = z.object({
  poiId: z.string(),
  poiName: z.string(),
  poiSlug: z.string(),
  order: z.number().int().min(1),
  arrivalTime: z.string(),
  duration: z.string(),
  note: z.string(),
  transportToNext: z.string().optional(),
});

const itineraryResponseSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(1000),
  totalDuration: z.string(),
  stops: z.array(stopSchema).min(2).max(20),
});

// ---------------------------------------------------------------------------
// Duration labels
// ---------------------------------------------------------------------------

const DURATION_LABELS: Record<string, string> = {
  '2-hours': 'about 2 hours',
  'half-day': 'about 4-5 hours (half day)',
  'full-day': 'about 8-10 hours (full day)',
  '2-days': '2 days',
};

const PACE_DESCRIPTIONS: Record<string, string> = {
  relaxed: 'Relaxed pace — fewer stops, more time at each place, plenty of breaks',
  moderate: 'Moderate pace — a balanced mix of exploring and resting',
  packed: 'Packed pace — as many places as possible, move quickly between stops',
};

// ---------------------------------------------------------------------------
// Format a POI for the prompt context
// ---------------------------------------------------------------------------

function formatPOIForPrompt(poi: {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  localTip: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  estimatedTimeToSpend: string | null;
  bestTimeToVisit: string;
  entryFee: string | null;
  openingHours: unknown;
  category: { name: string } | null;
  tags: Array<{ tag: { name: string } }>;
  subcategory: string | null;
  familyFriendly: boolean | null;
  budgetFriendly: boolean | null;
}): string {
  const lines: string[] = [];

  lines.push(`- ID: ${poi.id}`);
  lines.push(`  Name: ${poi.name}`);
  lines.push(`  Slug: ${poi.slug}`);

  if (poi.category) {
    lines.push(`  Category: ${poi.category.name}${poi.subcategory ? ` > ${poi.subcategory}` : ''}`);
  }

  if (poi.shortDescription) {
    lines.push(`  Description: ${poi.shortDescription}`);
  }

  lines.push(`  Location: ${poi.latitude.toFixed(5)}, ${poi.longitude.toFixed(5)}`);

  if (poi.address) {
    lines.push(`  Address: ${poi.address}`);
  }

  if (poi.estimatedTimeToSpend) {
    lines.push(`  Estimated time to spend: ${poi.estimatedTimeToSpend}`);
  }

  if (poi.bestTimeToVisit && poi.bestTimeToVisit !== 'ANY_TIME') {
    lines.push(`  Best time to visit: ${poi.bestTimeToVisit.replace(/_/g, ' ').toLowerCase()}`);
  }

  if (poi.entryFee) {
    lines.push(`  Entry fee: ${poi.entryFee}`);
  }

  if (poi.openingHours) {
    lines.push(`  Opening hours: ${JSON.stringify(poi.openingHours)}`);
  }

  if (poi.localTip) {
    lines.push(`  Local tip: ${poi.localTip}`);
  }

  if (poi.tags.length > 0) {
    lines.push(`  Tags: ${poi.tags.map((t) => t.tag.name).join(', ')}`);
  }

  const attrs: string[] = [];
  if (poi.familyFriendly) attrs.push('family-friendly');
  if (poi.budgetFriendly) attrs.push('budget-friendly');
  if (attrs.length > 0) {
    lines.push(`  Features: ${attrs.join(', ')}`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Build the system prompt
// ---------------------------------------------------------------------------

function buildItineraryPrompt(
  cityName: string,
  poisText: string,
  input: GenerateItineraryInput,
): string {
  const durationLabel = DURATION_LABELS[input.duration] || input.duration;
  const paceDesc = input.pace ? PACE_DESCRIPTIONS[input.pace] : PACE_DESCRIPTIONS.moderate;
  const interestsList = input.interests.length > 0
    ? input.interests.join(', ')
    : 'general sightseeing';
  const startTimeNote = input.startTime
    ? `The traveler wants to start at ${input.startTime}.`
    : 'The traveler has a flexible start time. Suggest reasonable morning start times.';

  return `You are an expert travel guide for Paper Maps, creating a personalized walking itinerary for ${cityName}.

RULES:
1. You MUST ONLY use POIs from the list below. Never invent or suggest places not in this list.
2. For each stop, you must use the EXACT id, name, and slug from the list.
3. Group nearby POIs together to minimize travel time.
4. Consider best time to visit and opening hours when ordering stops.
5. Match the traveler's interests: ${interestsList}
6. ${paceDesc}
7. Total itinerary duration should be ${durationLabel}.
8. ${startTimeNote}
9. Add a personal, friendly tip for each stop (like a friend would give). Keep tips concise (1-2 sentences).
10. Include realistic transport between stops (e.g., "5 min walk", "Auto-rickshaw 10 min", "Short walk through the market").
11. Give the itinerary a creative, catchy title that reflects the experience.

AVAILABLE POIs in ${cityName}:

${poisText}

Respond with ONLY a JSON object in this exact format, no markdown code blocks or other text:
{
  "title": "A catchy itinerary title",
  "description": "A 1-2 sentence description of the overall experience",
  "totalDuration": "e.g., 4-5 hours",
  "stops": [
    {
      "poiId": "exact-poi-id-from-list",
      "poiName": "exact-poi-name-from-list",
      "poiSlug": "exact-poi-slug-from-list",
      "order": 1,
      "arrivalTime": "9:00 AM",
      "duration": "45 min",
      "note": "A personal tip for this stop",
      "transportToNext": "5 min walk along the river"
    }
  ]
}`;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const itineraryGeneratorService = {
  async generateItinerary(input: GenerateItineraryInput): Promise<GeneratedItinerary> {
    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    // 1. Fetch the city
    const city = await prisma.city.findUnique({
      where: { slug: input.citySlug },
      select: { id: true, name: true },
    });

    if (!city) {
      throw new Error('CITY_NOT_FOUND');
    }

    // 2. Fetch all published POIs for this city
    const pois = await prisma.pOI.findMany({
      where: { cityId: city.id, status: 'PUBLISHED' },
      include: {
        category: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    if (pois.length < 2) {
      throw new Error('NOT_ENOUGH_POIS');
    }

    // 3. Build POI context text
    const poisText = pois.map((poi) => formatPOIForPrompt(poi)).join('\n\n');

    // 4. Build the prompt
    const prompt = buildItineraryPrompt(city.name, poisText, input);

    // 5. Call Claude Sonnet for fast generation
    const client = new Anthropic({ apiKey: config.anthropicApiKey });

    const message = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // 6. Parse and validate the response
    let parsedData: {
      title: string;
      description: string;
      totalDuration: string;
      stops: Array<{
        poiId: string;
        poiName: string;
        poiSlug: string;
        order: number;
        arrivalTime: string;
        duration: string;
        note: string;
        transportToNext?: string;
      }>;
    };
    try {
      const jsonData = JSON.parse(responseText);
      parsedData = itineraryResponseSchema.parse(jsonData) as typeof parsedData;
    } catch (err) {
      throw new Error(
        `Failed to parse AI response: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // 7. Validate that all POI IDs in the response actually exist in our curated set
    const validPoiIds = new Set(pois.map((p) => p.id));
    const validPoiSlugs = new Map(pois.map((p) => [p.id, p.slug]));
    const validPoiNames = new Map(pois.map((p) => [p.id, p.name]));

    const validatedStops: GeneratedStop[] = [];

    for (const stop of parsedData.stops) {
      if (!validPoiIds.has(stop.poiId)) {
        // Try to find by slug or name as fallback
        const matchBySlug = pois.find((p) => p.slug === stop.poiSlug);
        const matchByName = pois.find(
          (p) => p.name.toLowerCase() === stop.poiName.toLowerCase(),
        );
        const match = matchBySlug || matchByName;

        if (!match) {
          // Skip invalid POIs instead of failing the whole itinerary
          continue;
        }

        // Correct the stop with valid data
        validatedStops.push({
          ...stop,
          poiId: match.id,
          poiName: match.name,
          poiSlug: match.slug,
        });
      } else {
        // Ensure name and slug are correct even if ID matched
        validatedStops.push({
          ...stop,
          poiName: validPoiNames.get(stop.poiId) || stop.poiName,
          poiSlug: validPoiSlugs.get(stop.poiId) || stop.poiSlug,
        });
      }
    }

    if (validatedStops.length < 2) {
      throw new Error('AI_GENERATED_INVALID_ITINERARY');
    }

    // Re-number orders sequentially
    const reorderedStops = validatedStops.map((stop, index) => ({
      ...stop,
      order: index + 1,
    }));

    return {
      title: parsedData.title,
      description: parsedData.description,
      totalDuration: parsedData.totalDuration,
      stops: reorderedStops,
    };
  },
};
