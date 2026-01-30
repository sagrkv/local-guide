/**
 * Lighthouse Analysis Service
 * Handles Lighthouse audits with caching, error handling, and credit integration.
 */

import { prisma } from '../../lib/prisma.js';
import { creditsService } from '../credits/credits.service.js';
import { lighthouseAnalyzer } from '../scraping/utils/lighthouse.js';
import {
  LighthouseResult,
  ANALYSIS_CREDIT_COSTS,
  getQualificationStatus,
} from '../../types/analysis.js';
import { CreditTransactionType } from '@prisma/client';

interface AnalyzeSiteOptions {
  userId: string;
  leadId: string;
  skipCache?: boolean;
}

interface LighthouseServiceResult {
  success: boolean;
  result?: LighthouseResult;
  error?: string;
  creditsCharged: number;
  creditsRemaining: number;
  cached: boolean;
}

// Cache duration: 24 hours in milliseconds
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

export const lighthouseService = {
  /**
   * Analyze a website with Lighthouse.
   * Checks cache first, deducts credits, runs analysis, and stores results.
   */
  async analyzeSite(options: AnalyzeSiteOptions): Promise<LighthouseServiceResult> {
    const { userId, leadId, skipCache = false } = options;

    // Verify lead exists and belongs to user
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      select: {
        id: true,
        website: true,
        lighthouseScore: true,
        lighthouseSeo: true,
        lighthouseAccessibility: true,
        lighthouseBestPractices: true,
        updatedAt: true,
      },
    });

    if (!lead) {
      return {
        success: false,
        error: 'Lead not found',
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
        cached: false,
      };
    }

    if (!lead.website) {
      return {
        success: false,
        error: 'Lead has no website to analyze',
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
        cached: false,
      };
    }

    // Check cache: if we have recent scores and cache isn't skipped
    if (!skipCache && lead.lighthouseScore !== null) {
      const cacheAge = Date.now() - lead.updatedAt.getTime();
      if (cacheAge < CACHE_DURATION_MS) {
        const overall = this.calculateOverallScore({
          performance: lead.lighthouseScore,
          seo: lead.lighthouseSeo ?? 0,
          accessibility: lead.lighthouseAccessibility ?? 0,
          bestPractices: lead.lighthouseBestPractices ?? 0,
        });

        return {
          success: true,
          result: {
            performance: lead.lighthouseScore,
            accessibility: lead.lighthouseAccessibility ?? 0,
            bestPractices: lead.lighthouseBestPractices ?? 0,
            seo: lead.lighthouseSeo ?? 0,
            overall,
            opportunities: [],
            analyzedAt: lead.updatedAt,
          },
          creditsCharged: 0,
          creditsRemaining: await creditsService.getBalance(userId),
          cached: true,
        };
      }
    }

    // Check and deduct credits before running analysis
    const creditCost = ANALYSIS_CREDIT_COSTS.LIGHTHOUSE;

    try {
      const hasSufficient = await creditsService.hasSufficientCredits(userId, creditCost);
      if (!hasSufficient) {
        return {
          success: false,
          error: `Insufficient credits. Lighthouse analysis requires ${creditCost} credit(s).`,
          creditsCharged: 0,
          creditsRemaining: await creditsService.getBalance(userId),
          cached: false,
        };
      }

      // Deduct credits BEFORE running analysis
      await creditsService.deductCredits({
        userId,
        amount: creditCost,
        type: CreditTransactionType.ANALYSIS_CHARGE,
        description: `Lighthouse analysis for lead: ${leadId}`,
        reference: leadId,
      });
    } catch (creditError) {
      const errorMessage = creditError instanceof Error ? creditError.message : 'Credit deduction failed';
      return {
        success: false,
        error: errorMessage,
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
        cached: false,
      };
    }

    // Run Lighthouse analysis
    try {
      const lighthouseResults = await lighthouseAnalyzer.analyze(lead.website);

      const overall = this.calculateOverallScore({
        performance: lighthouseResults.performance,
        seo: lighthouseResults.seo,
        accessibility: lighthouseResults.accessibility,
        bestPractices: lighthouseResults.bestPractices,
      });

      // Generate opportunities based on low scores
      const opportunities = this.generateOpportunities(lighthouseResults);

      // Build update data
      const updateData: Record<string, unknown> = {
        lighthouseScore: lighthouseResults.performance,
        lighthouseSeo: lighthouseResults.seo,
        lighthouseAccessibility: lighthouseResults.accessibility,
        lighthouseBestPractices: lighthouseResults.bestPractices,
        websiteNeedsRedesign: overall < 70,
        qualificationError: null,
      };

      // Update website URL if redirected
      if (lighthouseResults.redirected && lighthouseResults.finalUrl) {
        updateData.website = lighthouseResults.finalUrl;
      }

      // Handle parked/expired domains
      if (lighthouseResults.domainStatus === 'parked' || lighthouseResults.domainStatus === 'expired') {
        updateData.qualificationError = lighthouseResults.statusMessage;
        updateData.hasWebsite = false;
      }

      // Save results to database
      await prisma.lead.update({
        where: { id: leadId },
        data: updateData,
      });

      const result: LighthouseResult = {
        performance: lighthouseResults.performance,
        accessibility: lighthouseResults.accessibility,
        bestPractices: lighthouseResults.bestPractices,
        seo: lighthouseResults.seo,
        overall,
        opportunities,
        analyzedAt: new Date(),
        finalUrl: lighthouseResults.finalUrl,
        redirected: lighthouseResults.redirected,
        domainStatus: lighthouseResults.domainStatus,
        statusMessage: lighthouseResults.statusMessage,
      };

      return {
        success: true,
        result,
        creditsCharged: creditCost,
        creditsRemaining: await creditsService.getBalance(userId),
        cached: false,
      };
    } catch (analysisError) {
      const errorMessage = analysisError instanceof Error ? analysisError.message : 'Analysis failed';

      // Refund credits on analysis failure
      try {
        await creditsService.addCredits({
          userId,
          amount: creditCost,
          type: CreditTransactionType.ADMIN_ADJUSTMENT,
          description: `Refund: Lighthouse analysis failed for lead: ${leadId}`,
          reference: leadId,
        });
      } catch (refundError) {
        // Log refund failure but don't throw - user should see the analysis error
        const refundErrorMsg = refundError instanceof Error ? refundError.message : 'Refund failed';
        console.error(`[Lighthouse] Credit refund failed: ${refundErrorMsg}`);
      }

      // Save error to lead
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          qualificationError: `Lighthouse failed: ${errorMessage}`,
        },
      });

      return {
        success: false,
        error: `Lighthouse analysis failed: ${errorMessage}`,
        creditsCharged: 0, // Refunded
        creditsRemaining: await creditsService.getBalance(userId),
        cached: false,
      };
    }
  },

  /**
   * Calculate overall score as average of all four metrics.
   */
  calculateOverallScore(scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  }): number {
    const { performance, seo, accessibility, bestPractices } = scores;
    return Math.round((performance + seo + accessibility + bestPractices) / 4);
  },

  /**
   * Generate improvement opportunities based on Lighthouse scores.
   */
  generateOpportunities(results: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  }): string[] {
    const opportunities: string[] = [];

    if (results.performance < 50) {
      opportunities.push('Critical: Website performance is very poor. Consider complete rebuild.');
    } else if (results.performance < 70) {
      opportunities.push('Website loads slowly. Image optimization and caching could help.');
    }

    if (results.seo < 50) {
      opportunities.push('Critical: SEO is severely lacking. Site is nearly invisible to search engines.');
    } else if (results.seo < 70) {
      opportunities.push('SEO needs improvement. Meta tags, structured data, and content optimization needed.');
    }

    if (results.accessibility < 50) {
      opportunities.push('Critical: Major accessibility issues. Site may not be usable by many visitors.');
    } else if (results.accessibility < 70) {
      opportunities.push('Accessibility improvements needed. Color contrast, alt text, and ARIA labels.');
    }

    if (results.bestPractices < 50) {
      opportunities.push('Critical: Modern web standards not followed. Security and compatibility issues likely.');
    } else if (results.bestPractices < 70) {
      opportunities.push('Best practices not fully implemented. HTTPS, image formats, and security headers.');
    }

    return opportunities;
  },

  /**
   * Get cached analysis results for a lead without running new analysis.
   */
  async getCachedAnalysis(leadId: string, userId: string): Promise<LighthouseResult | null> {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      select: {
        lighthouseScore: true,
        lighthouseSeo: true,
        lighthouseAccessibility: true,
        lighthouseBestPractices: true,
        updatedAt: true,
      },
    });

    if (!lead || lead.lighthouseScore === null) {
      return null;
    }

    const overall = this.calculateOverallScore({
      performance: lead.lighthouseScore,
      seo: lead.lighthouseSeo ?? 0,
      accessibility: lead.lighthouseAccessibility ?? 0,
      bestPractices: lead.lighthouseBestPractices ?? 0,
    });

    return {
      performance: lead.lighthouseScore,
      accessibility: lead.lighthouseAccessibility ?? 0,
      bestPractices: lead.lighthouseBestPractices ?? 0,
      seo: lead.lighthouseSeo ?? 0,
      overall,
      opportunities: this.generateOpportunities({
        performance: lead.lighthouseScore,
        seo: lead.lighthouseSeo ?? 0,
        accessibility: lead.lighthouseAccessibility ?? 0,
        bestPractices: lead.lighthouseBestPractices ?? 0,
      }),
      analyzedAt: lead.updatedAt,
    };
  },

  /**
   * Get qualification status for a lead based on stored Lighthouse scores.
   */
  async getQualificationStatus(leadId: string, userId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      select: {
        hasWebsite: true,
        lighthouseScore: true,
        lighthouseSeo: true,
        lighthouseAccessibility: true,
        lighthouseBestPractices: true,
      },
    });

    if (!lead) {
      return null;
    }

    if (!lead.hasWebsite) {
      return {
        status: getQualificationStatus(null),
        isQualified: false,
        reason: 'Business has no website',
      };
    }

    if (lead.lighthouseScore === null) {
      return {
        status: 'NOT_ANALYZED' as const,
        isQualified: null,
        reason: 'Website has not been analyzed yet',
      };
    }

    const overall = this.calculateOverallScore({
      performance: lead.lighthouseScore,
      seo: lead.lighthouseSeo ?? 0,
      accessibility: lead.lighthouseAccessibility ?? 0,
      bestPractices: lead.lighthouseBestPractices ?? 0,
    });

    const status = getQualificationStatus(overall);
    const isQualified = status === 'POOR_WEBSITE';

    return {
      status,
      isQualified,
      overallScore: overall,
      reason: isQualified
        ? 'Website needs improvement - qualified lead'
        : 'Website is good - not a qualified lead',
    };
  },
};
