import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config.js';
import { BestSeason, POIPriority, TimeOfDay } from '@prisma/client';

const enrichmentResponseSchema = z.object({
  shortDescription: z.string().max(300).optional(),
  longDescription: z.string().max(2000).optional(),
  localTip: z.string().max(500).optional(),
  estimatedTimeToSpend: z.string().max(100).optional(),
  bestTimeToVisit: z.enum(['EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'ANY_TIME']).optional(),
  bestSeason: z.enum(['SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'MONSOON', 'ALL_YEAR']).optional(),
  tags: z.array(z.string()).max(10).optional(),
  priority: z.enum(['MUST_VISIT', 'RECOMMENDED', 'HIDDEN_GEM', 'OPTIONAL']).optional(),
});

type EnrichmentResponse = z.infer<typeof enrichmentResponseSchema>;

function buildEnrichmentPrompt(poiName: string, cityName: string, categoryName: string, existingData: Record<string, unknown>): string {
  const existingFields = Object.entries(existingData)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  return `You are a knowledgeable local travel guide. Generate tourist-friendly content for a Point of Interest (POI).

POI: ${poiName}
City: ${cityName}
Category: ${categoryName}
${existingFields ? `\nExisting information:\n${existingFields}` : ''}

Generate the following fields as a JSON object. ONLY include fields that you have confident, accurate information about. Do NOT make up specific details like prices or hours if you're unsure.

Required JSON format:
{
  "shortDescription": "A concise 1-2 sentence tourist-friendly description (max 300 chars)",
  "longDescription": "A detailed 2-4 paragraph description covering history, significance, what to expect, and why to visit (max 2000 chars)",
  "localTip": "An insider tip that only locals would know (max 500 chars)",
  "estimatedTimeToSpend": "How long a typical visit takes, e.g. '1-2 hours'",
  "bestTimeToVisit": "One of: EARLY_MORNING, MORNING, AFTERNOON, EVENING, NIGHT, ANY_TIME",
  "bestSeason": "One of: SPRING, SUMMER, AUTUMN, WINTER, MONSOON, ALL_YEAR",
  "tags": ["array", "of", "relevant", "tags"],
  "priority": "One of: MUST_VISIT, RECOMMENDED, HIDDEN_GEM, OPTIONAL"
}

Respond ONLY with the JSON object, no markdown code blocks or other text.`;
}

export const enrichmentService = {
  async enrichPOI(poiId: string): Promise<{ enriched: boolean; fieldsUpdated: string[] }> {
    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const poi = await prisma.pOI.findUnique({
      where: { id: poiId },
      include: {
        city: { select: { name: true } },
        category: { select: { name: true } },
      },
    });

    if (!poi) {
      throw new Error('POI not found');
    }

    const existingData: Record<string, unknown> = {};
    if (poi.shortDescription) existingData.shortDescription = poi.shortDescription;
    if (poi.longDescription) existingData.longDescription = poi.longDescription;
    if (poi.localTip) existingData.localTip = poi.localTip;
    if (poi.estimatedTimeToSpend) existingData.estimatedTimeToSpend = poi.estimatedTimeToSpend;
    if (poi.address) existingData.address = poi.address;

    const prompt = buildEnrichmentPrompt(
      poi.name,
      poi.city.name,
      poi.category.name,
      existingData,
    );

    const client = new Anthropic({ apiKey: config.anthropicApiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    let parsedResponse: EnrichmentResponse;
    try {
      const jsonData = JSON.parse(responseText);
      parsedResponse = enrichmentResponseSchema.parse(jsonData);
    } catch (err) {
      throw new Error(`Failed to parse AI response: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Only fill empty fields (don't overwrite human edits)
    const updateData: Record<string, unknown> = {};
    const fieldsUpdated: string[] = [];

    if (!poi.shortDescription && parsedResponse.shortDescription) {
      updateData.shortDescription = parsedResponse.shortDescription;
      fieldsUpdated.push('shortDescription');
    }
    if (!poi.longDescription && parsedResponse.longDescription) {
      updateData.longDescription = parsedResponse.longDescription;
      fieldsUpdated.push('longDescription');
    }
    if (!poi.localTip && parsedResponse.localTip) {
      updateData.localTip = parsedResponse.localTip;
      fieldsUpdated.push('localTip');
    }
    if (!poi.estimatedTimeToSpend && parsedResponse.estimatedTimeToSpend) {
      updateData.estimatedTimeToSpend = parsedResponse.estimatedTimeToSpend;
      fieldsUpdated.push('estimatedTimeToSpend');
    }
    if (poi.bestTimeToVisit === 'ANY_TIME' && parsedResponse.bestTimeToVisit) {
      updateData.bestTimeToVisit = parsedResponse.bestTimeToVisit as TimeOfDay;
      fieldsUpdated.push('bestTimeToVisit');
    }
    if (poi.bestSeason === 'ALL_YEAR' && parsedResponse.bestSeason) {
      updateData.bestSeason = parsedResponse.bestSeason as BestSeason;
      fieldsUpdated.push('bestSeason');
    }
    if (poi.priority === 'RECOMMENDED' && parsedResponse.priority) {
      updateData.priority = parsedResponse.priority as POIPriority;
      fieldsUpdated.push('priority');
    }

    if (fieldsUpdated.length > 0) {
      await prisma.pOI.update({
        where: { id: poiId },
        data: updateData as any,
      });
    }

    // Handle tags separately
    if (parsedResponse.tags && parsedResponse.tags.length > 0) {
      const existingTags = await prisma.tagsOnPOIs.findMany({
        where: { poiId },
        select: { tagId: true },
      });

      if (existingTags.length === 0) {
        for (const tagName of parsedResponse.tags) {
          try {
            const slugifiedTag = tagName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');

            const tag = await prisma.tag.upsert({
              where: { slug: slugifiedTag },
              create: { name: tagName, slug: slugifiedTag },
              update: {},
            });

            await prisma.tagsOnPOIs.create({
              data: { poiId, tagId: tag.id },
            }).catch(() => {
              // Ignore duplicate tag associations
            });
          } catch {
            // Ignore individual tag failures
          }
        }
        fieldsUpdated.push('tags');
      }
    }

    return { enriched: fieldsUpdated.length > 0, fieldsUpdated };
  },

  async enrichBatch(cityId: string): Promise<{ enriched: number; failed: number; skipped: number }> {
    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const pois = await prisma.pOI.findMany({
      where: { cityId, status: 'AI_SUGGESTED' },
      select: { id: true },
    });

    let enriched = 0;
    let failed = 0;
    let skipped = 0;

    for (const poi of pois) {
      try {
        const result = await enrichmentService.enrichPOI(poi.id);
        if (result.enriched) {
          enriched++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`Failed to enrich POI ${poi.id}:`, err);
        failed++;
      }
    }

    return { enriched, failed, skipped };
  },
};
