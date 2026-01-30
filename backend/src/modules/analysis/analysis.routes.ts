/**
 * Analysis Routes
 * API endpoints for website analysis including Lighthouse, tech stack, and sales intelligence.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { lighthouseService } from './lighthouse.service.js';
import { creditsService } from '../credits/credits.service.js';
import { scanTechStack } from '../scraping/utils/tech-stack-scanner.js';
import { perplexityClient } from '../scraping/utils/perplexity.js';
import { salesIntelService, SalesIntelError } from './salesintel.service.js';
import { ANALYSIS_CREDIT_COSTS, getQualificationStatus } from '../../types/analysis.js';
import { CreditTransactionType } from '@prisma/client';

const lighthouseRequestSchema = z.object({
  skipCache: z.boolean().optional().default(false),
});

const techStackRequestSchema = z.object({
  url: z.string().url().optional(),
});

export async function analysisRoutes(fastify: FastifyInstance) {
  // Add auth to all routes
  fastify.addHook('preHandler', fastify.authenticate);

  /**
   * POST /api/leads/:id/analyze/lighthouse
   * Run Lighthouse analysis on a lead's website.
   * Cost: 1 credit
   */
  fastify.post('/:id/analyze/lighthouse', async (request, reply) => {
    const { id: leadId } = request.params as { id: string };
    const { skipCache } = lighthouseRequestSchema.parse(request.body || {});

    const result = await lighthouseService.analyzeSite({
      userId: request.user.userId,
      leadId,
      skipCache,
    });

    if (!result.success) {
      const statusCode = result.error?.includes('not found') ? 404 : 400;
      return reply.status(statusCode).send({
        success: false,
        error: result.error,
        creditsCharged: result.creditsCharged,
        creditsRemaining: result.creditsRemaining,
      });
    }

    return {
      success: true,
      ...result.result,
      creditsCharged: result.creditsCharged,
      creditsRemaining: result.creditsRemaining,
      cached: result.cached,
    };
  });

  /**
   * POST /api/leads/:id/analyze/tech-stack
   * Analyze the technology stack of a lead's website.
   * Cost: 1 credit
   */
  fastify.post('/:id/analyze/tech-stack', async (request, reply) => {
    const { id: leadId } = request.params as { id: string };
    const data = techStackRequestSchema.parse(request.body || {});
    const userId = request.user.userId;

    // Verify lead exists and belongs to user
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      select: {
        id: true,
        website: true,
        salesIntelligence: true,
      },
    });

    if (!lead) {
      return reply.status(404).send({
        success: false,
        error: 'Lead not found',
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
      });
    }

    const url = data.url || lead.website;
    if (!url) {
      return reply.status(400).send({
        success: false,
        error: 'Lead has no website to analyze',
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
      });
    }

    // Check and deduct credits
    const creditCost = ANALYSIS_CREDIT_COSTS.TECH_STACK;
    try {
      const hasSufficient = await creditsService.hasSufficientCredits(userId, creditCost);
      if (!hasSufficient) {
        return reply.status(400).send({
          success: false,
          error: `Insufficient credits. Tech stack analysis requires ${creditCost} credit(s).`,
          creditsCharged: 0,
          creditsRemaining: await creditsService.getBalance(userId),
        });
      }

      await creditsService.deductCredits({
        userId,
        amount: creditCost,
        type: CreditTransactionType.ANALYSIS_CHARGE,
        description: `Tech stack analysis for lead: ${leadId}`,
        reference: leadId,
      });
    } catch (creditError) {
      const errorMessage = creditError instanceof Error ? creditError.message : 'Credit deduction failed';
      return reply.status(400).send({
        success: false,
        error: errorMessage,
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
      });
    }

    try {
      const scanResult = await scanTechStack(url);

      // Transform to the expected response format
      const techStack = {
        cms: scanResult.cms,
        framework: scanResult.framework,
        hosting: scanResult.hosting,
        ecommerce: scanResult.ecommerce,
        analytics: scanResult.analytics,
        marketing: scanResult.marketing,
        security: scanResult.security,
        mobile: {
          isResponsive: scanResult.mobile.isResponsive,
          hasViewportMeta: scanResult.mobile.hasViewportMeta,
        },
        performance: {
          loadTimeMs: scanResult.performance.loadTimeMs,
          issues: scanResult.performance.issues,
        },
        jsLibraries: scanResult.jsLibraries,
        cssFrameworks: scanResult.cssFrameworks,
        fonts: scanResult.fonts,
        socialIntegrations: scanResult.socialIntegrations,
        paymentGateways: scanResult.otherTechnologies.filter((t: string) =>
          ['Razorpay', 'PayPal', 'Stripe'].includes(t)
        ),
        chatbots: scanResult.chatbots,
        otherTechnologies: scanResult.otherTechnologies.filter(
          (t: string) => !['Razorpay', 'PayPal', 'Stripe'].includes(t)
        ),
        recommendations: scanResult.recommendations,
        analyzedAt: new Date().toISOString(),
      };

      // Save tech stack to salesIntelligence
      const existingIntelligence = (lead.salesIntelligence as Record<string, unknown>) || {};
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          salesIntelligence: {
            ...existingIntelligence,
            techStack,
            techStackAnalyzedAt: new Date().toISOString(),
          },
        },
      });

      return {
        success: true,
        ...techStack,
        creditsCharged: creditCost,
        creditsRemaining: await creditsService.getBalance(userId),
      };
    } catch (analysisError) {
      // Refund credits on failure
      try {
        await creditsService.addCredits({
          userId,
          amount: creditCost,
          type: CreditTransactionType.ADMIN_ADJUSTMENT,
          description: `Refund: Tech stack analysis failed for lead: ${leadId}`,
          reference: leadId,
        });
      } catch (refundError) {
        const refundErrorMsg = refundError instanceof Error ? refundError.message : 'Refund failed';
        console.error(`[TechStack] Credit refund failed: ${refundErrorMsg}`);
      }

      const errorMessage = analysisError instanceof Error ? analysisError.message : 'Analysis failed';
      return reply.status(500).send({
        success: false,
        error: `Tech stack analysis failed: ${errorMessage}`,
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
      });
    }
  });

  /**
   * POST /api/leads/:id/analyze/sales-intelligence
   * Run deep research for sales intelligence using Perplexity.
   * Cost: 2 credits
   */
  fastify.post('/:id/analyze/sales-intelligence', async (request, reply) => {
    const { id: leadId } = request.params as { id: string };
    const userId = request.user.userId;

    // Verify lead exists and belongs to user
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      select: {
        id: true,
        businessName: true,
        address: true,
        city: true,
        website: true,
        category: true,
      },
    });

    if (!lead) {
      return reply.status(404).send({
        success: false,
        error: 'Lead not found',
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
      });
    }

    // Check and deduct credits
    const creditCost = ANALYSIS_CREDIT_COSTS.SALES_INTELLIGENCE;
    try {
      const hasSufficient = await creditsService.hasSufficientCredits(userId, creditCost);
      if (!hasSufficient) {
        return reply.status(400).send({
          success: false,
          error: `Insufficient credits. Sales intelligence requires ${creditCost} credit(s).`,
          creditsCharged: 0,
          creditsRemaining: await creditsService.getBalance(userId),
        });
      }

      await creditsService.deductCredits({
        userId,
        amount: creditCost,
        type: CreditTransactionType.ANALYSIS_CHARGE,
        description: `Sales intelligence for lead: ${leadId}`,
        reference: leadId,
      });
    } catch (creditError) {
      const errorMessage = creditError instanceof Error ? creditError.message : 'Credit deduction failed';
      return reply.status(400).send({
        success: false,
        error: errorMessage,
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
      });
    }

    try {
      const research = await perplexityClient.deepResearch({
        name: lead.businessName,
        address: lead.address ?? undefined,
        city: lead.city ?? undefined,
        website: lead.website ?? undefined,
        category: lead.category ?? undefined,
      });

      // Build the structured salesIntelligence object
      const salesIntelligence = JSON.parse(
        JSON.stringify({
          decisionMakers: research.decisionMakers,
          companySize: research.companySize,
          estimatedRevenue: research.estimatedRevenue,
          foundedYear: research.foundedYear,
          industry: research.industry,
          specializations: research.specializations,
          painPoints: research.painPoints,
          webServiceNeeds: research.webServiceNeeds,
          recentNews: research.recentNews,
          competitorWebsites: research.competitorWebsites,
          personalizedPitch: research.personalizedPitch,
          researchedAt: new Date().toISOString(),
        })
      );

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          perplexityAnalysis: research.rawAnalysis,
          salesIntelligence,
          ...(research.email && { email: research.email }),
          ...(research.phone && { phone: research.phone }),
          ...(research.ownerName && { contactPerson: research.ownerName }),
        },
      });

      return {
        success: true,
        ...research,
        creditsCharged: creditCost,
        creditsRemaining: await creditsService.getBalance(userId),
      };
    } catch (analysisError) {
      // Refund credits on failure
      try {
        await creditsService.addCredits({
          userId,
          amount: creditCost,
          type: CreditTransactionType.ADMIN_ADJUSTMENT,
          description: `Refund: Sales intelligence failed for lead: ${leadId}`,
          reference: leadId,
        });
      } catch (refundError) {
        const refundErrorMsg = refundError instanceof Error ? refundError.message : 'Refund failed';
        console.error(`[SalesIntel] Credit refund failed: ${refundErrorMsg}`);
      }

      const errorMessage = analysisError instanceof Error ? analysisError.message : 'Analysis failed';
      return reply.status(500).send({
        success: false,
        error: `Sales intelligence failed: ${errorMessage}`,
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
      });
    }
  });

  /**
   * POST /api/leads/:id/analyze/salesintel
   * Generate focused sales intelligence for B2B web services outreach.
   * This is a simpler, more focused version optimized for sales outreach.
   * Cost: 1 credit
   *
   * Response format:
   * {
   *   salesIntelligence: {
   *     overview: string,      // 2-3 sentence business summary
   *     painPoints: string[],  // Potential needs for web services
   *     outreachAngle: string, // Suggested approach
   *     talkingPoints: string[], // Key conversation points
   *     recentNews?: string[], // Recent business updates
   *     generatedAt: Date
   *   },
   *   creditsCharged: 1
   * }
   */
  fastify.post('/:id/analyze/salesintel', async (request, reply) => {
    const { id: leadId } = request.params as { id: string };
    const userId = request.user.userId;

    try {
      const result = await salesIntelService.generateSalesIntel(leadId, userId);
      return result;
    } catch (error) {
      if (error instanceof SalesIntelError) {
        return reply.status(error.statusCode).send({
          error: error.message,
          code: error.code,
        });
      }

      // Log unexpected errors
      request.log.error(error, 'Unexpected error generating sales intelligence');
      return reply.status(500).send({
        error: 'An unexpected error occurred while generating sales intelligence',
        code: 'UNEXPECTED_ERROR',
      });
    }
  });

  /**
   * GET /api/leads/:id/analyze/salesintel
   * Get existing sales intelligence (simpler format) for a lead.
   */
  fastify.get('/:id/analyze/salesintel', async (request, reply) => {
    const { id: leadId } = request.params as { id: string };
    const userId = request.user.userId;

    try {
      const salesIntelligence = await salesIntelService.getSalesIntel(leadId, userId);

      if (!salesIntelligence) {
        return reply.status(404).send({
          error: 'Sales intelligence not found for this lead',
          code: 'SALES_INTEL_NOT_FOUND',
        });
      }

      return { salesIntelligence };
    } catch (error) {
      if (error instanceof SalesIntelError) {
        return reply.status(error.statusCode).send({
          error: error.message,
          code: error.code,
        });
      }

      request.log.error(error, 'Unexpected error fetching sales intelligence');
      return reply.status(500).send({
        error: 'An unexpected error occurred',
        code: 'UNEXPECTED_ERROR',
      });
    }
  });

  /**
   * GET /api/leads/:id/analysis
   * Get all cached analysis results for a lead.
   */
  fastify.get('/:id/analysis', async (request, reply) => {
    const { id: leadId } = request.params as { id: string };
    const userId = request.user.userId;

    // Verify lead exists and belongs to user
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      select: {
        id: true,
        hasWebsite: true,
        website: true,
        lighthouseScore: true,
        lighthouseSeo: true,
        lighthouseAccessibility: true,
        lighthouseBestPractices: true,
        websiteNeedsRedesign: true,
        qualificationError: true,
        salesIntelligence: true,
        perplexityAnalysis: true,
        updatedAt: true,
      },
    });

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    // Build Lighthouse result if we have scores
    let lighthouse = null;
    if (lead.lighthouseScore !== null) {
      const overall = lighthouseService.calculateOverallScore({
        performance: lead.lighthouseScore,
        seo: lead.lighthouseSeo ?? 0,
        accessibility: lead.lighthouseAccessibility ?? 0,
        bestPractices: lead.lighthouseBestPractices ?? 0,
      });

      lighthouse = {
        performance: lead.lighthouseScore,
        accessibility: lead.lighthouseAccessibility,
        bestPractices: lead.lighthouseBestPractices,
        seo: lead.lighthouseSeo,
        overall,
        websiteNeedsRedesign: lead.websiteNeedsRedesign,
        opportunities: lighthouseService.generateOpportunities({
          performance: lead.lighthouseScore,
          seo: lead.lighthouseSeo ?? 0,
          accessibility: lead.lighthouseAccessibility ?? 0,
          bestPractices: lead.lighthouseBestPractices ?? 0,
        }),
      };
    }

    // Extract tech stack and sales intelligence from salesIntelligence JSON
    const salesIntel = lead.salesIntelligence as Record<string, unknown> | null;
    const techStack = salesIntel?.techStack ?? null;
    const salesIntelligence = salesIntel
      ? {
          decisionMakers: salesIntel.decisionMakers,
          companySize: salesIntel.companySize,
          estimatedRevenue: salesIntel.estimatedRevenue,
          foundedYear: salesIntel.foundedYear,
          industry: salesIntel.industry,
          specializations: salesIntel.specializations,
          painPoints: salesIntel.painPoints,
          webServiceNeeds: salesIntel.webServiceNeeds,
          recentNews: salesIntel.recentNews,
          competitorWebsites: salesIntel.competitorWebsites,
          personalizedPitch: salesIntel.personalizedPitch,
          researchedAt: salesIntel.researchedAt,
        }
      : null;

    // Determine qualification status
    const qualificationStatus = lead.hasWebsite
      ? lighthouse
        ? getQualificationStatus(lighthouse.overall)
        : 'NOT_ANALYZED'
      : 'NO_WEBSITE';

    return {
      lighthouse,
      techStack,
      salesIntelligence,
      qualificationStatus,
      qualificationError: lead.qualificationError,
      hasWebsite: lead.hasWebsite,
      website: lead.website,
      lastUpdated: lead.updatedAt,
    };
  });

  /**
   * GET /api/leads/:id/qualification
   * Get qualification status for a lead based on Lighthouse analysis.
   */
  fastify.get('/:id/qualification', async (request, reply) => {
    const { id: leadId } = request.params as { id: string };
    const userId = request.user.userId;

    const qualification = await lighthouseService.getQualificationStatus(leadId, userId);

    if (!qualification) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return qualification;
  });

  /**
   * GET /api/analysis/credit-costs
   * Get the credit costs for each analysis type.
   */
  fastify.get('/credit-costs', async () => {
    return {
      lighthouse: ANALYSIS_CREDIT_COSTS.LIGHTHOUSE,
      techStack: ANALYSIS_CREDIT_COSTS.TECH_STACK,
      salesIntelligence: ANALYSIS_CREDIT_COSTS.SALES_INTELLIGENCE,
    };
  });
}
