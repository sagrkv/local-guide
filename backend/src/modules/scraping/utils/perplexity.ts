import { config } from "../../../config.js";
import { logApiCall, type ApiCallLog } from "../../../lib/api-logger.js";

interface PerplexityResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface BusinessResult {
  name: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  hasWebsite: boolean;
  needsRedesign?: boolean;
}

export interface DecisionMaker {
  name: string;
  title?: string;
  email?: string;
  linkedin?: string;
}

export interface CompanyIntelligence {
  companySize?: string; // "1-10", "11-50", "51-200", "201-500", "500+"
  estimatedRevenue?: string;
  foundedYear?: number;
  industry?: string;
  specializations?: string[];
  recentNews?: string[];
  growthIndicators?: string[];
}

export interface TechStack {
  cms?: string; // WordPress, Shopify, Wix, Squarespace, custom, etc.
  framework?: string; // React, Angular, Vue, Next.js, etc.
  hosting?: string; // AWS, GoDaddy, Hostinger, etc.
  ecommerce?: string; // WooCommerce, Shopify, Magento, etc.
  analytics?: string[]; // Google Analytics, Facebook Pixel, etc.
  marketing?: string[]; // Mailchimp, HubSpot, etc.
  security?: {
    hasSSL: boolean;
    sslIssuer?: string;
  };
  mobile?: {
    isResponsive: boolean;
    hasMobileApp?: boolean;
  };
  performance?: {
    estimatedLoadTime?: string;
    issues?: string[];
  };
  seoTools?: string[]; // Yoast, RankMath, etc.
  socialIntegrations?: string[];
  paymentGateways?: string[];
  chatbots?: string[];
  otherTechnologies?: string[];
  recommendations?: string[]; // What they should upgrade/add
}

export interface EnrichedBusinessData {
  // Basic contact info
  email?: string;
  phone?: string;
  website?: string;
  ownerName?: string;
  hasWebsite: boolean;

  // Decision makers
  decisionMakers?: DecisionMaker[];

  // Company intelligence
  companySize?: string;
  estimatedRevenue?: string;
  foundedYear?: number;
  industry?: string;
  specializations?: string[];

  // Pain points & opportunities
  painPoints?: string[];
  webServiceNeeds?: string[];

  // Outreach context
  recentNews?: string[];
  competitorWebsites?: string[];
  personalizedPitch?: string;

  // Tech stack
  techStack?: TechStack;

  // Raw analysis for display
  rawAnalysis?: string;
}

// Track current scrape job for logging context
let currentScrapeJobId: string | undefined;

export const perplexityClient = {
  /**
   * Set the current scrape job ID for logging context
   */
  setScrapeJobId(jobId: string | undefined): void {
    currentScrapeJobId = jobId;
  },

  async query(
    prompt: string,
    context?: { businessName?: string; city?: string },
  ): Promise<string> {
    const startTime = Date.now();
    const endpoint = "/chat/completions";

    if (!config.perplexityApiKey) {
      // Log the failed attempt even when API key is missing
      await logApiCall({
        provider: "PERPLEXITY",
        endpoint,
        method: "POST",
        statusCode: 0,
        responseTimeMs: 0,
        success: false,
        error: "API key not configured",
        scrapeJobId: currentScrapeJobId,
        metadata: context ? { ...context } : undefined,
      });
      throw new Error("Perplexity API key not configured");
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.perplexityApiKey}`,
      },
      body: JSON.stringify({
        // Updated to use current Perplexity Sonar model (the old llama-3.1-sonar-small-128k-online was deprecated)
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that finds and analyzes business information. Always respond with structured, accurate data.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      // Capture the error response body for better debugging
      let errorDetails = "";
      try {
        const errorBody = await response.text();
        errorDetails = errorBody;
        console.error("Perplexity API error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorBody,
        });
      } catch {
        console.error(
          "Perplexity API error (could not read body):",
          response.status,
          response.statusText,
        );
      }

      // Log the failed API call
      await logApiCall({
        provider: "PERPLEXITY",
        endpoint,
        method: "POST",
        statusCode: response.status,
        responseTimeMs,
        success: false,
        error: errorDetails || response.statusText,
        scrapeJobId: currentScrapeJobId,
        metadata: {
          promptLength: prompt.length,
          ...context,
        },
      });

      throw new Error(
        `Perplexity API error: ${response.status} - ${errorDetails || response.statusText}`,
      );
    }

    const data = (await response.json()) as PerplexityResponse;
    const responseContent = data.choices?.[0]?.message?.content || "";

    // Try to extract structured data from response for logging
    let extractedData: Record<string, unknown> | undefined;
    try {
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Ignore parse errors for logging
    }

    // Log the successful API call with useful context
    await logApiCall({
      provider: "PERPLEXITY",
      endpoint,
      method: "POST",
      statusCode: response.status,
      responseTimeMs,
      success: true,
      scrapeJobId: currentScrapeJobId,
      metadata: {
        // Context
        businessName: context?.businessName,
        city: context?.city,
        // Request info
        promptLength: prompt.length,
        // Response info
        responseLength: responseContent.length,
        // Extracted data (what was found)
        foundEmail: extractedData?.email || null,
        foundPhone: extractedData?.phone || null,
        foundOwner: extractedData?.ownerName || null,
      },
    });

    return responseContent;
  },

  async searchBusinesses(
    query: string,
    location?: string,
  ): Promise<BusinessResult[]> {
    const prompt = `Find ${query}${location ? ` in ${location}` : ""}.

For each business found, provide:
1. Business name
2. Whether they have a website (yes/no)
3. Website URL if available
4. Phone number if available
5. Email if available
6. Address/City

Format your response as a JSON array with objects containing: name, hasWebsite, website, phone, email, address, city.
Only include businesses you are confident about. Return maximum 10 businesses.
Response must be valid JSON array only, no other text.`;

    // This will throw if API key is missing or API fails
    const response = await this.query(prompt, {
      businessName: query,
      city: location,
    });

    // Try to parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error(
        "Failed to parse Perplexity response as JSON array. Response may be malformed.",
      );
    }

    try {
      const businesses = JSON.parse(jsonMatch[0]);
      return businesses.map((b: any) => ({
        name: b.name || "",
        description: b.description,
        website: b.website,
        phone: b.phone,
        email: b.email,
        address: b.address,
        city: b.city || location,
        hasWebsite:
          b.hasWebsite === true || b.hasWebsite === "yes" || !!b.website,
      }));
    } catch (parseError) {
      throw new Error(
        `Failed to parse Perplexity JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`,
      );
    }
  },

  async analyzeWebsite(url: string): Promise<{
    isOutdated: boolean;
    isMobileResponsive: boolean;
    needsRedesign: boolean;
    summary: string;
  }> {
    const prompt = `Analyze the website at ${url}. Determine:
1. Is the website design outdated (older than 3-4 years)?
2. Does it appear to be mobile responsive?
3. Does it need a redesign?
4. Brief summary of the website quality.

Respond in JSON format with keys: isOutdated (boolean), isMobileResponsive (boolean), needsRedesign (boolean), summary (string).
Return only valid JSON, no other text.`;

    try {
      const response = await this.query(prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          isOutdated: false,
          isMobileResponsive: true,
          needsRedesign: false,
          summary: "Unable to analyze",
        };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error analyzing website with Perplexity:", error);
      return {
        isOutdated: false,
        isMobileResponsive: true,
        needsRedesign: false,
        summary: "Analysis failed",
      };
    }
  },

  async enrichBusinessInfo(
    businessName: string,
    city?: string,
  ): Promise<{
    email?: string;
    phone?: string;
    website?: string;
    socialMedia?: string[];
    description?: string;
  }> {
    const location = city ? ` in ${city}` : "";
    const prompt = `Find contact information for "${businessName}"${location}.

Return:
1. Email address
2. Phone number
3. Website URL
4. Social media links (LinkedIn, Twitter, Instagram, Facebook)
5. Brief description of the business

Respond in JSON format with keys: email, phone, website, socialMedia (array), description.
Return only valid JSON, no other text. Use null for missing information.`;

    try {
      const response = await this.query(prompt);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {};
      }

      const data = JSON.parse(jsonMatch[0]);
      return {
        email: data.email || undefined,
        phone: data.phone || undefined,
        website: data.website || undefined,
        socialMedia: Array.isArray(data.socialMedia)
          ? data.socialMedia.filter(Boolean)
          : undefined,
        description: data.description || undefined,
      };
    } catch (error) {
      console.error("Error enriching business info with Perplexity:", error);
      return {};
    }
  },

  /**
   * Enrich a business from Google Places with contact info
   * Optimized prompt for businesses we already know exist
   */
  async enrichFromGooglePlace(business: {
    name: string;
    address: string;
    city?: string;
  }): Promise<{
    email?: string;
    phone?: string;
    website?: string;
    ownerName?: string;
    hasWebsite: boolean;
  }> {
    const prompt = `Find contact details for this business:
Name: "${business.name}"
Address: ${business.address}
${business.city ? `City: ${business.city}` : ""}

I need:
1. Business email (info@, contact@, or owner's email)
2. Phone number
3. Website URL (if they have one)
4. Owner/manager name (if available)

Respond in JSON format: { "email": "", "phone": "", "website": "", "ownerName": "" }
Use null for any information you cannot find. Return only valid JSON.`;

    try {
      const response = await this.query(prompt, {
        businessName: business.name,
        city: business.city,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { hasWebsite: false };
      }

      const data = JSON.parse(jsonMatch[0]);
      return {
        email: data.email || undefined,
        phone: data.phone || undefined,
        website: data.website || undefined,
        ownerName: data.ownerName || undefined,
        hasWebsite: !!data.website,
      };
    } catch (error) {
      console.error(`Error enriching ${business.name} with Perplexity:`, error);
      return { hasWebsite: false };
    }
  },

  /**
   * Batch enrich multiple businesses (with rate limiting)
   */
  async batchEnrich(
    businesses: Array<{ name: string; address: string; city?: string }>,
    onProgress?: (completed: number, total: number) => void,
  ): Promise<
    Map<
      string,
      {
        email?: string;
        phone?: string;
        website?: string;
        ownerName?: string;
        hasWebsite: boolean;
      }
    >
  > {
    const results = new Map<
      string,
      {
        email?: string;
        phone?: string;
        website?: string;
        ownerName?: string;
        hasWebsite: boolean;
      }
    >();

    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      const key = `${business.name}|${business.address}`;

      try {
        const enriched = await this.enrichFromGooglePlace(business);
        results.set(key, enriched);
      } catch (error) {
        console.error(`Failed to enrich ${business.name}:`, error);
        results.set(key, { hasWebsite: false });
      }

      if (onProgress) {
        onProgress(i + 1, businesses.length);
      }

      // Rate limit: ~1 request per second to avoid hitting limits
      if (i < businesses.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  },

  /**
   * Deep research a business for sales intelligence
   * This is a comprehensive analysis designed to help with outreach
   */
  async deepResearch(business: {
    name: string;
    address?: string;
    city?: string;
    website?: string;
    category?: string;
  }): Promise<EnrichedBusinessData> {
    const prompt = `Research this business thoroughly for B2B sales outreach:

Business: "${business.name}"
${business.address ? `Address: ${business.address}` : ""}
${business.city ? `City: ${business.city}` : ""}
${business.website ? `Website: ${business.website}` : ""}
${business.category ? `Industry: ${business.category}` : ""}

Provide comprehensive business intelligence:

1. CONTACT INFO: Email, phone, website URL
2. DECISION MAKERS: Owner name, title, LinkedIn profile, email if available
3. COMPANY SIZE: Estimate employees (1-10, 11-50, 51-200, 201-500, 500+)
4. REVENUE: Estimated annual revenue range
5. FOUNDED: Year established
6. SPECIALIZATIONS: What they specifically do/sell
7. PAIN POINTS: Common challenges this type of business faces with their digital presence
8. WEB SERVICE NEEDS: What web/digital services could benefit them (website redesign, SEO, e-commerce, etc.)
9. RECENT NEWS: Any recent announcements, expansions, awards, or news about the company
10. COMPETITORS: 2-3 competitors with better websites (provide URLs)
11. PITCH ANGLE: A personalized 2-sentence pitch for why they should upgrade their website

Return as JSON:
{
  "email": "string or null",
  "phone": "string or null",
  "website": "string or null",
  "ownerName": "string or null",
  "decisionMakers": [{"name": "string", "title": "string", "email": "string or null", "linkedin": "string or null"}],
  "companySize": "string or null",
  "estimatedRevenue": "string or null",
  "foundedYear": number or null,
  "industry": "string or null",
  "specializations": ["string"],
  "painPoints": ["string"],
  "webServiceNeeds": ["string"],
  "recentNews": ["string"],
  "competitorWebsites": ["string"],
  "personalizedPitch": "string"
}

Return only valid JSON, no other text.`;

    try {
      const response = await this.query(prompt, {
        businessName: business.name,
        city: business.city,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          hasWebsite: !!business.website,
          rawAnalysis: response,
        };
      }

      const data = JSON.parse(jsonMatch[0]);
      return {
        email: data.email || undefined,
        phone: data.phone || undefined,
        website: data.website || business.website || undefined,
        ownerName: data.ownerName || undefined,
        hasWebsite: !!data.website || !!business.website,
        decisionMakers: Array.isArray(data.decisionMakers)
          ? data.decisionMakers.filter((dm: DecisionMaker) => dm.name)
          : undefined,
        companySize: data.companySize || undefined,
        estimatedRevenue: data.estimatedRevenue || undefined,
        foundedYear: data.foundedYear || undefined,
        industry: data.industry || undefined,
        specializations: Array.isArray(data.specializations)
          ? data.specializations.filter(Boolean)
          : undefined,
        painPoints: Array.isArray(data.painPoints)
          ? data.painPoints.filter(Boolean)
          : undefined,
        webServiceNeeds: Array.isArray(data.webServiceNeeds)
          ? data.webServiceNeeds.filter(Boolean)
          : undefined,
        recentNews: Array.isArray(data.recentNews)
          ? data.recentNews.filter(Boolean)
          : undefined,
        competitorWebsites: Array.isArray(data.competitorWebsites)
          ? data.competitorWebsites.filter(Boolean)
          : undefined,
        personalizedPitch: data.personalizedPitch || undefined,
        rawAnalysis: response,
      };
    } catch (error) {
      console.error(`Error deep researching ${business.name}:`, error);
      return {
        hasWebsite: !!business.website,
      };
    }
  },

  /**
   * Find decision makers for a specific company
   * Useful for direct outreach
   */
  async findDecisionMakers(business: {
    name: string;
    city?: string;
    website?: string;
  }): Promise<DecisionMaker[]> {
    const prompt = `Find key decision makers at "${business.name}"${business.city ? ` in ${business.city}` : ""}.

Look for:
- Owner / CEO / Founder
- Marketing Manager / Director
- IT Manager / CTO
- Operations Manager

For each person, provide:
1. Full name
2. Job title
3. Email address (if publicly available)
4. LinkedIn profile URL

Return as JSON array:
[{"name": "string", "title": "string", "email": "string or null", "linkedin": "string or null"}]

Return only valid JSON array, no other text. Maximum 5 people.`;

    try {
      const response = await this.query(prompt, {
        businessName: business.name,
        city: business.city,
      });

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const data = JSON.parse(jsonMatch[0]);
      return Array.isArray(data)
        ? data
            .filter((dm: DecisionMaker) => dm.name)
            .map((dm: DecisionMaker) => ({
              name: dm.name,
              title: dm.title || undefined,
              email: dm.email || undefined,
              linkedin: dm.linkedin || undefined,
            }))
        : [];
    } catch (error) {
      console.error(
        `Error finding decision makers for ${business.name}:`,
        error,
      );
      return [];
    }
  },

  /**
   * Generate a personalized outreach email based on business research
   */
  async generateOutreachEmail(business: {
    name: string;
    ownerName?: string;
    website?: string;
    painPoints?: string[];
    webServiceNeeds?: string[];
    lighthouseScore?: number;
  }): Promise<{
    subject: string;
    body: string;
  } | null> {
    const painPointsText =
      business.painPoints && business.painPoints.length > 0
        ? `Known pain points: ${business.painPoints.join(", ")}`
        : "";
    const needsText =
      business.webServiceNeeds && business.webServiceNeeds.length > 0
        ? `Potential needs: ${business.webServiceNeeds.join(", ")}`
        : "";
    const scoreText =
      business.lighthouseScore !== undefined
        ? `Their website performance score is ${business.lighthouseScore}/100 (needs improvement)`
        : "";

    const prompt = `Write a professional cold outreach email for a web development agency reaching out to "${business.name}".

Context:
- Contact person: ${business.ownerName || "Business Owner"}
- Their website: ${business.website || "Unknown"}
${scoreText}
${painPointsText}
${needsText}

Requirements:
1. Subject line should be attention-grabbing but professional
2. Email should be 3-4 short paragraphs
3. Mention specific observations about their current website/digital presence
4. Propose clear value (better website = more customers/sales)
5. Include a soft call-to-action (free consultation/audit)
6. Keep it under 150 words
7. Sound human, not like a template

Return as JSON: {"subject": "string", "body": "string"}
Return only valid JSON.`;

    try {
      const response = await this.query(prompt, {
        businessName: business.name,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const data = JSON.parse(jsonMatch[0]);
      return {
        subject: data.subject || "",
        body: data.body || "",
      };
    } catch (error) {
      console.error(`Error generating email for ${business.name}:`, error);
      return null;
    }
  },

  /**
   * Detect technology stack of a website
   * Analyzes what technologies, CMS, frameworks, and tools a website uses
   */
  async detectTechStack(url: string): Promise<TechStack | null> {
    const prompt = `Analyze the technology stack of this website: ${url}

Detect and identify:
1. CMS (WordPress, Shopify, Wix, Squarespace, Webflow, custom built, etc.)
2. Frontend framework (React, Angular, Vue, Next.js, vanilla JS, jQuery, etc.)
3. Hosting provider (AWS, GoDaddy, Hostinger, Cloudflare, Vercel, etc.)
4. E-commerce platform (WooCommerce, Shopify, Magento, BigCommerce, none, etc.)
5. Analytics tools (Google Analytics, Facebook Pixel, Hotjar, etc.)
6. Marketing tools (Mailchimp, HubSpot, ActiveCampaign, etc.)
7. SSL certificate (yes/no, issuer if known)
8. Mobile responsiveness (yes/no)
9. SEO tools/plugins (Yoast, RankMath, All in One SEO, etc.)
10. Social media integrations
11. Payment gateways (if e-commerce)
12. Chatbots/live chat (Intercom, Drift, Tawk.to, WhatsApp, etc.)
13. Other notable technologies
14. Recommendations for what they should upgrade or add

Return as JSON:
{
  "cms": "string or null",
  "framework": "string or null",
  "hosting": "string or null",
  "ecommerce": "string or null",
  "analytics": ["string"],
  "marketing": ["string"],
  "security": {"hasSSL": boolean, "sslIssuer": "string or null"},
  "mobile": {"isResponsive": boolean, "hasMobileApp": boolean or null},
  "performance": {"estimatedLoadTime": "string or null", "issues": ["string"]},
  "seoTools": ["string"],
  "socialIntegrations": ["string"],
  "paymentGateways": ["string"],
  "chatbots": ["string"],
  "otherTechnologies": ["string"],
  "recommendations": ["string"]
}

Return only valid JSON, no other text. Use empty arrays [] for fields with no data, not null.`;

    try {
      const response = await this.query(prompt, {
        businessName: url,
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return null;
      }

      const data = JSON.parse(jsonMatch[0]);
      return {
        cms: data.cms || undefined,
        framework: data.framework || undefined,
        hosting: data.hosting || undefined,
        ecommerce: data.ecommerce || undefined,
        analytics: Array.isArray(data.analytics)
          ? data.analytics.filter(Boolean)
          : undefined,
        marketing: Array.isArray(data.marketing)
          ? data.marketing.filter(Boolean)
          : undefined,
        security: data.security || undefined,
        mobile: data.mobile || undefined,
        performance: data.performance || undefined,
        seoTools: Array.isArray(data.seoTools)
          ? data.seoTools.filter(Boolean)
          : undefined,
        socialIntegrations: Array.isArray(data.socialIntegrations)
          ? data.socialIntegrations.filter(Boolean)
          : undefined,
        paymentGateways: Array.isArray(data.paymentGateways)
          ? data.paymentGateways.filter(Boolean)
          : undefined,
        chatbots: Array.isArray(data.chatbots)
          ? data.chatbots.filter(Boolean)
          : undefined,
        otherTechnologies: Array.isArray(data.otherTechnologies)
          ? data.otherTechnologies.filter(Boolean)
          : undefined,
        recommendations: Array.isArray(data.recommendations)
          ? data.recommendations.filter(Boolean)
          : undefined,
      };
    } catch (error) {
      console.error(`Error detecting tech stack for ${url}:`, error);
      return null;
    }
  },
};
