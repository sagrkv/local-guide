import { LeadCategory, LeadSource } from '@prisma/client';

interface LeadScoreInput {
  category?: LeadCategory;
  city?: string | null;
  state?: string | null;
  email?: string | null;
  phone?: string | null;
  hasWebsite?: boolean;
  lighthouseScore?: number | null;
  websiteNeedsRedesign?: boolean;
  source?: LeadSource;
}

interface ScoreBreakdown {
  category: number;
  location: number;
  contactInfo: number;
  websiteStatus: number;
  source: number;
  total: number;
}

// Priority cities in India for web development services
const PRIORITY_CITIES = [
  'bangalore',
  'bengaluru',
  'hyderabad',
  'mumbai',
  'delhi',
  'pune',
  'chennai',
  'gurgaon',
  'gurugram',
  'noida',
];

// Category scores - higher value categories get more points
const CATEGORY_SCORES: Record<LeadCategory, number> = {
  STARTUP: 30,
  ECOMMERCE: 28,
  AGENCY: 25,
  RESTAURANT: 22,
  HOTEL: 22,
  SALON: 20,
  CLINIC: 20,
  GYM: 18,
  RETAIL: 18,
  EDUCATION: 16,
  REAL_ESTATE: 16,
  OTHER: 10,
};

export const scoringEngine = {
  calculateScore(lead: LeadScoreInput): number {
    const breakdown = this.getScoreBreakdown(lead);
    return breakdown.total;
  },

  getScoreBreakdown(lead: LeadScoreInput): ScoreBreakdown {
    const breakdown: ScoreBreakdown = {
      category: 0,
      location: 0,
      contactInfo: 0,
      websiteStatus: 0,
      source: 0,
      total: 0,
    };

    // Category scoring (up to 30 points)
    breakdown.category = CATEGORY_SCORES[lead.category || 'OTHER'];

    // Location scoring (up to 20 points)
    if (lead.city) {
      const cityLower = lead.city.toLowerCase();
      if (PRIORITY_CITIES.some((c) => cityLower.includes(c))) {
        breakdown.location = 20;
      } else {
        breakdown.location = 10;
      }
    }

    // Contact info scoring (up to 20 points)
    if (lead.email) breakdown.contactInfo += 10;
    if (lead.phone) breakdown.contactInfo += 10;

    // Website status scoring (up to 15 points)
    if (!lead.hasWebsite) {
      // No website = opportunity
      breakdown.websiteStatus = 10;
    } else if (lead.lighthouseScore !== undefined && lead.lighthouseScore !== null && lead.lighthouseScore < 50) {
      // Poor website = bigger opportunity
      breakdown.websiteStatus = 15;
    } else if (lead.websiteNeedsRedesign) {
      // Outdated website
      breakdown.websiteStatus = 12;
    }

    // Source scoring (up to 10 points)
    if (lead.source === 'WEBSITE_CONTACT') {
      breakdown.source = 10; // Inbound lead is highest value
    } else if (lead.source === 'REFERRAL') {
      breakdown.source = 8;
    } else if (lead.source === 'PERPLEXITY') {
      breakdown.source = 5;
    }

    // Calculate total (max 100)
    breakdown.total = Math.min(
      100,
      breakdown.category +
        breakdown.location +
        breakdown.contactInfo +
        breakdown.websiteStatus +
        breakdown.source
    );

    return breakdown;
  },

  getScoreLabel(score: number): 'hot' | 'warm' | 'cold' {
    if (score >= 70) return 'hot';
    if (score >= 40) return 'warm';
    return 'cold';
  },

  getRecommendedPriority(score: number): 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= 80) return 'URGENT';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  },
};
