/**
 * Analysis Types
 * Type definitions for website analysis features including Lighthouse, tech stack, and sales intelligence.
 */

/**
 * Lighthouse Analysis Result
 * Scores range from 0-100, with higher being better.
 */
export interface LighthouseResult {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  overall: number;
  opportunities: string[];
  analyzedAt: Date;
  finalUrl?: string;
  redirected?: boolean;
  domainStatus?: 'active' | 'expired' | 'parked' | 'error';
  statusMessage?: string;
}

/**
 * Lighthouse Analysis Error
 */
export interface LighthouseError {
  error: string;
  url: string;
  timestamp: Date;
}

/**
 * Website Qualification Status based on Lighthouse analysis
 */
export type QualificationStatus = 'NO_WEBSITE' | 'POOR_WEBSITE' | 'WEBSITE_IS_GOOD' | 'WEBSITE_UNREACHABLE';

/**
 * Determines qualification status based on Lighthouse overall score.
 * - NO_WEBSITE: Lead has no website (score is null)
 * - POOR_WEBSITE: Score < 70 (Qualified - needs web services)
 * - WEBSITE_IS_GOOD: Score >= 70 (Not qualified - has good website)
 */
export function getQualificationStatus(score: number | null): QualificationStatus {
  if (score === null) {
    return 'NO_WEBSITE';
  }
  if (score < 70) {
    return 'POOR_WEBSITE';
  }
  return 'WEBSITE_IS_GOOD';
}

/**
 * Technology Category Types
 */
export type TechnologyCategory =
  | "CMS"
  | "Framework"
  | "Analytics"
  | "E-commerce"
  | "Marketing"
  | "Hosting"
  | "Security"
  | "JavaScript Library"
  | "CSS Framework"
  | "Font"
  | "Social"
  | "Chatbot"
  | "Payment"
  | "Other";

/**
 * Single detected technology with confidence score
 */
export interface Technology {
  name: string;
  category: TechnologyCategory;
  confidence: number; // 0-100
}

/**
 * Tech sophistication level
 */
export type TechSophisticationLevel = "low" | "medium" | "high";

/**
 * Tech Stack Summary
 */
export interface TechStackSummary {
  hasCMS: boolean;
  hasAnalytics: boolean;
  hasEcommerce: boolean;
  techSophistication: TechSophisticationLevel;
}

/**
 * Tech Stack Analysis Result
 */
export interface TechStackResult {
  technologies: Technology[];
  summary: TechStackSummary;
  analyzedAt: Date;

  // Detailed breakdown (for backward compatibility and detailed views)
  cms: string | null;
  framework: string | null;
  hosting: string | null;
  ecommerce: string | null;
  analytics: string[];
  marketing: string[];
  security: {
    hasSSL: boolean;
    sslIssuer?: string;
  };
  mobile: {
    isResponsive: boolean;
    hasViewportMeta: boolean;
  };
  performance: {
    loadTimeMs: number;
    issues: string[];
  };
  jsLibraries: string[];
  cssFrameworks: string[];
  fonts: string[];
  socialIntegrations: string[];
  paymentGateways: string[];
  chatbots: string[];
  otherTechnologies: string[];
  recommendations: string[];
}

/**
 * Sales Intelligence Result from Perplexity deep research
 */
export interface SalesIntelligenceResult {
  decisionMakers: Array<{
    name: string;
    role: string;
    linkedIn?: string;
    email?: string;
  }>;
  companySize?: string;
  estimatedRevenue?: string;
  foundedYear?: number;
  industry?: string;
  specializations: string[];
  painPoints: string[];
  webServiceNeeds: string[];
  recentNews: string[];
  competitorWebsites: string[];
  personalizedPitch?: string;
  researchedAt: Date;
}

/**
 * Combined Analysis Result for a Lead
 */
export interface LeadAnalysis {
  lighthouse?: LighthouseResult;
  techStack?: TechStackResult;
  salesIntelligence?: SalesIntelligenceResult;
  qualificationStatus: QualificationStatus;
  lastAnalyzedAt?: Date;
}

/**
 * Analysis API Response
 */
export interface AnalysisResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  creditsCharged: number;
  creditsRemaining: number;
}

/**
 * Lighthouse Analysis Request
 */
export interface LighthouseAnalysisRequest {
  leadId: string;
}

/**
 * Credit costs for different analysis types
 */
export const ANALYSIS_CREDIT_COSTS = {
  LIGHTHOUSE: 1,
  TECH_STACK: 1,
  SALES_INTELLIGENCE: 2,
} as const;

export type AnalysisType = keyof typeof ANALYSIS_CREDIT_COSTS;
