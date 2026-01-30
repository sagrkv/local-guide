/**
 * Tech Stack Analysis Service
 *
 * Provides tech stack detection for lead websites with credit integration.
 * Uses Playwright-based scanning to detect CMS, frameworks, analytics, and more.
 */

import { prisma } from "../../lib/prisma.js";
import { creditsService } from "../credits/credits.service.js";
import {
  scanTechStack,
  type TechStackResult as ScannerResult,
} from "../scraping/utils/tech-stack-scanner.js";
import {
  type Technology,
  type TechnologyCategory,
  type TechStackResult,
  type TechStackSummary,
  type TechSophisticationLevel,
  ANALYSIS_CREDIT_COSTS,
} from "../../types/analysis.js";

const TECH_STACK_CREDIT_COST = ANALYSIS_CREDIT_COSTS.TECH_STACK;

/**
 * Calculate tech sophistication level based on detected technologies
 */
function calculateSophistication(
  hasModernFramework: boolean,
  hasAnalytics: boolean,
  hasCMS: boolean,
  hasEcommerce: boolean,
  techCount: number
): TechSophisticationLevel {
  // High: Modern framework + analytics + multiple integrations
  if (hasModernFramework && hasAnalytics && techCount >= 8) {
    return "high";
  }

  // Medium: Has CMS or framework with some integrations
  if ((hasCMS || hasModernFramework) && techCount >= 4) {
    return "medium";
  }

  // Medium: Has e-commerce platform
  if (hasEcommerce) {
    return "medium";
  }

  // Low: Basic or minimal tech stack
  return "low";
}

/**
 * Map category string to TechnologyCategory type
 */
function mapCategory(category: string): TechnologyCategory {
  const categoryMap: Record<string, TechnologyCategory> = {
    cms: "CMS",
    framework: "Framework",
    analytics: "Analytics",
    ecommerce: "E-commerce",
    marketing: "Marketing",
    hosting: "Hosting",
    security: "Security",
    jsLibrary: "JavaScript Library",
    cssFramework: "CSS Framework",
    font: "Font",
    social: "Social",
    chatbot: "Chatbot",
    payment: "Payment",
  };

  return categoryMap[category.toLowerCase()] || "Other";
}

/**
 * Convert scanner result to our typed TechStackResult with technologies array
 */
function transformScannerResult(scanResult: ScannerResult): TechStackResult {
  const technologies: Technology[] = [];

  // Add CMS if detected (high confidence since pattern-matched)
  if (scanResult.cms) {
    technologies.push({
      name: scanResult.cms,
      category: "CMS",
      confidence: 90,
    });
  }

  // Add Framework if detected
  if (scanResult.framework) {
    technologies.push({
      name: scanResult.framework,
      category: "Framework",
      confidence: 85,
    });
  }

  // Add Hosting if detected
  if (scanResult.hosting) {
    technologies.push({
      name: scanResult.hosting,
      category: "Hosting",
      confidence: 80,
    });
  }

  // Add E-commerce if detected
  if (scanResult.ecommerce) {
    technologies.push({
      name: scanResult.ecommerce,
      category: "E-commerce",
      confidence: 90,
    });
  }

  // Add Analytics tools
  for (const tool of scanResult.analytics) {
    technologies.push({
      name: tool,
      category: "Analytics",
      confidence: 85,
    });
  }

  // Add Marketing tools
  for (const tool of scanResult.marketing) {
    technologies.push({
      name: tool,
      category: "Marketing",
      confidence: 80,
    });
  }

  // Add JS Libraries
  for (const lib of scanResult.jsLibraries) {
    technologies.push({
      name: lib,
      category: "JavaScript Library",
      confidence: 85,
    });
  }

  // Add CSS Frameworks
  for (const fw of scanResult.cssFrameworks) {
    technologies.push({
      name: fw,
      category: "CSS Framework",
      confidence: 90,
    });
  }

  // Add Fonts
  for (const font of scanResult.fonts) {
    technologies.push({
      name: font,
      category: "Font",
      confidence: 75,
    });
  }

  // Add Social Integrations
  for (const social of scanResult.socialIntegrations) {
    technologies.push({
      name: social,
      category: "Social",
      confidence: 85,
    });
  }

  // Add Chatbots
  for (const chatbot of scanResult.chatbots) {
    technologies.push({
      name: chatbot,
      category: "Chatbot",
      confidence: 90,
    });
  }

  // Add Payment Gateways (from otherTechnologies)
  const paymentGateways = scanResult.otherTechnologies.filter((t) =>
    ["Razorpay", "PayPal", "Stripe"].includes(t)
  );
  for (const gateway of paymentGateways) {
    technologies.push({
      name: gateway,
      category: "Payment",
      confidence: 95,
    });
  }

  // Add other technologies
  const otherTech = scanResult.otherTechnologies.filter(
    (t) => !["Razorpay", "PayPal", "Stripe"].includes(t)
  );
  for (const tech of otherTech) {
    technologies.push({
      name: tech,
      category: "Other",
      confidence: 70,
    });
  }

  // Modern frameworks list for sophistication check
  const modernFrameworks = [
    "React",
    "Vue",
    "Angular",
    "Next.js",
    "Nuxt.js",
    "Svelte",
    "Gatsby",
  ];
  const hasModernFramework = scanResult.framework
    ? modernFrameworks.includes(scanResult.framework)
    : false;

  // Calculate summary
  const summary: TechStackSummary = {
    hasCMS: !!scanResult.cms,
    hasAnalytics: scanResult.analytics.length > 0,
    hasEcommerce: !!scanResult.ecommerce,
    techSophistication: calculateSophistication(
      hasModernFramework,
      scanResult.analytics.length > 0,
      !!scanResult.cms,
      !!scanResult.ecommerce,
      technologies.length
    ),
  };

  return {
    technologies,
    summary,
    analyzedAt: new Date(),
    cms: scanResult.cms || null,
    framework: scanResult.framework || null,
    hosting: scanResult.hosting || null,
    ecommerce: scanResult.ecommerce || null,
    analytics: scanResult.analytics,
    marketing: scanResult.marketing,
    security: {
      hasSSL: scanResult.security.hasSSL,
      sslIssuer: scanResult.security.sslIssuer,
    },
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
    paymentGateways,
    chatbots: scanResult.chatbots,
    otherTechnologies: otherTech,
    recommendations: scanResult.recommendations,
  };
}

export interface AnalyzeTechStackParams {
  leadId: string;
  userId: string;
}

export interface TechStackAnalysisResponse {
  success: boolean;
  data?: TechStackResult;
  error?: string;
  creditsCharged: number;
  creditsRemaining: number;
}

export const techStackService = {
  /**
   * Analyze the tech stack of a lead's website
   * Deducts credits on successful analysis
   */
  async analyzeTechStack(
    params: AnalyzeTechStackParams
  ): Promise<TechStackAnalysisResponse> {
    const { leadId, userId } = params;

    // 1. Verify lead exists and belongs to user (multi-tenancy)
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId },
      select: {
        id: true,
        website: true,
        businessName: true,
        salesIntelligence: true,
      },
    });

    if (!lead) {
      return {
        success: false,
        error: "Lead not found",
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
      };
    }

    if (!lead.website) {
      return {
        success: false,
        error: "Lead has no website to analyze",
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
      };
    }

    // 2. Check if user has sufficient credits
    const hasSufficientCredits = await creditsService.hasSufficientCredits(
      userId,
      TECH_STACK_CREDIT_COST
    );

    if (!hasSufficientCredits) {
      return {
        success: false,
        error: "Insufficient credits. Tech stack analysis costs 1 credit.",
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
      };
    }

    // 3. Perform the tech stack scan
    try {
      const scanResult = await scanTechStack(lead.website);
      const techStackResult = transformScannerResult(scanResult);

      // 4. Deduct credits after successful scan
      const newBalance = await creditsService.deductCredits({
        userId,
        amount: TECH_STACK_CREDIT_COST,
        type: "ANALYSIS_CHARGE",
        description: `Tech stack analysis for ${lead.businessName}`,
        reference: leadId,
      });

      // 5. Save the tech stack to the lead's salesIntelligence
      // Serialize to plain JSON for Prisma's Json field
      const existingIntelligence =
        (lead.salesIntelligence as Record<string, unknown>) || {};

      const techStackForStorage = {
        ...techStackResult,
        analyzedAt: techStackResult.analyzedAt.toISOString(),
      };

      await prisma.lead.update({
        where: { id: leadId },
        data: {
          salesIntelligence: JSON.parse(
            JSON.stringify({
              ...existingIntelligence,
              techStack: techStackForStorage,
              techStackAnalyzedAt: techStackResult.analyzedAt.toISOString(),
            })
          ),
        },
      });

      return {
        success: true,
        data: techStackResult,
        creditsCharged: TECH_STACK_CREDIT_COST,
        creditsRemaining: newBalance,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to analyze website";

      return {
        success: false,
        error: `Tech stack analysis failed: ${errorMessage}`,
        creditsCharged: 0,
        creditsRemaining: await creditsService.getBalance(userId),
      };
    }
  },

  /**
   * Get the credit cost for tech stack analysis
   */
  getCreditCost(): number {
    return TECH_STACK_CREDIT_COST;
  },
};
