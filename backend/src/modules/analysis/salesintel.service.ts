import { config } from "../../config.js";
import { logApiCall } from "../../lib/api-logger.js";
import { prisma } from "../../lib/prisma.js";
import { creditsService } from "../credits/credits.service.js";
import { Lead } from "@prisma/client";

// Credit cost for sales intelligence generation
const SALES_INTEL_CREDIT_COST = 1;

// Timeout for Perplexity API calls (30 seconds)
const API_TIMEOUT_MS = 30000;

// Rate limiting - max requests per minute
const MAX_REQUESTS_PER_MINUTE = 10;

// Simple in-memory rate limiting
const requestTimestamps: number[] = [];

export interface SalesIntelligence {
  overview: string;
  painPoints: string[];
  outreachAngle: string;
  talkingPoints: string[];
  recentNews?: string[];
  generatedAt: Date;
}

interface PerplexityResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class SalesIntelError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "SalesIntelError";
  }
}

/**
 * Check rate limiting
 */
function checkRateLimit(): void {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Remove timestamps older than 1 minute
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    throw new SalesIntelError(
      "Rate limit exceeded. Please try again in a minute.",
      "RATE_LIMIT_EXCEEDED",
      429,
    );
  }

  requestTimestamps.push(now);
}

/**
 * Parse JSON from Perplexity response, handling markdown code blocks
 */
function parseJsonResponse(content: string): Record<string, unknown> {
  // Try to extract JSON from markdown code block first
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Fall through to try other methods
    }
  }

  // Try to extract raw JSON object
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new SalesIntelError(
        "Failed to parse AI response as JSON",
        "INVALID_RESPONSE_FORMAT",
        500,
      );
    }
  }

  throw new SalesIntelError(
    "AI response did not contain valid JSON",
    "INVALID_RESPONSE_FORMAT",
    500,
  );
}

/**
 * Validate the parsed response has the required fields
 */
function validateSalesIntelResponse(
  data: Record<string, unknown>,
): SalesIntelligence {
  const overview = typeof data.overview === "string" ? data.overview : "";
  const painPoints = Array.isArray(data.painPoints)
    ? data.painPoints.filter((p): p is string => typeof p === "string")
    : [];
  const outreachAngle =
    typeof data.outreachAngle === "string" ? data.outreachAngle : "";
  const talkingPoints = Array.isArray(data.talkingPoints)
    ? data.talkingPoints.filter((p): p is string => typeof p === "string")
    : [];
  const recentNews = Array.isArray(data.recentNews)
    ? data.recentNews.filter((n): n is string => typeof n === "string")
    : undefined;

  // Validate required fields have content
  if (!overview) {
    throw new SalesIntelError(
      "AI response missing required field: overview",
      "INVALID_RESPONSE_FORMAT",
      500,
    );
  }

  if (painPoints.length === 0) {
    throw new SalesIntelError(
      "AI response missing required field: painPoints",
      "INVALID_RESPONSE_FORMAT",
      500,
    );
  }

  if (!outreachAngle) {
    throw new SalesIntelError(
      "AI response missing required field: outreachAngle",
      "INVALID_RESPONSE_FORMAT",
      500,
    );
  }

  if (talkingPoints.length === 0) {
    throw new SalesIntelError(
      "AI response missing required field: talkingPoints",
      "INVALID_RESPONSE_FORMAT",
      500,
    );
  }

  return {
    overview,
    painPoints,
    outreachAngle,
    talkingPoints,
    recentNews: recentNews && recentNews.length > 0 ? recentNews : undefined,
    generatedAt: new Date(),
  };
}

/**
 * Call Perplexity API with timeout
 */
async function callPerplexityApi(
  prompt: string,
  context: { businessName: string; city?: string },
): Promise<string> {
  const startTime = Date.now();
  const endpoint = "/chat/completions";

  if (!config.perplexityApiKey) {
    await logApiCall({
      provider: "PERPLEXITY",
      endpoint,
      method: "POST",
      statusCode: 0,
      responseTimeMs: 0,
      success: false,
      error: "API key not configured",
      metadata: { ...context },
    });
    throw new SalesIntelError(
      "Perplexity API key not configured",
      "API_KEY_MISSING",
      503,
    );
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.perplexityApiKey}`,
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "You are a B2B sales intelligence analyst. Analyze businesses and provide actionable insights for web services sales outreach. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    if (!response.ok) {
      let errorDetails = "";
      try {
        const errorBody = await response.text();
        errorDetails = errorBody;
      } catch {
        // Ignore error reading body
      }

      await logApiCall({
        provider: "PERPLEXITY",
        endpoint,
        method: "POST",
        statusCode: response.status,
        responseTimeMs,
        success: false,
        error: errorDetails || response.statusText,
        metadata: {
          promptLength: prompt.length,
          ...context,
        },
      });

      // Handle specific HTTP status codes
      if (response.status === 429) {
        throw new SalesIntelError(
          "Perplexity API rate limit exceeded. Please try again later.",
          "PERPLEXITY_RATE_LIMIT",
          429,
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new SalesIntelError(
          "Perplexity API authentication failed",
          "API_AUTH_FAILED",
          503,
        );
      }

      throw new SalesIntelError(
        `Perplexity API error: ${response.status} - ${errorDetails || response.statusText}`,
        "PERPLEXITY_API_ERROR",
        502,
      );
    }

    const data = (await response.json()) as PerplexityResponse;
    const responseContent = data.choices?.[0]?.message?.content || "";

    await logApiCall({
      provider: "PERPLEXITY",
      endpoint,
      method: "POST",
      statusCode: response.status,
      responseTimeMs,
      success: true,
      metadata: {
        businessName: context.businessName,
        city: context.city,
        promptLength: prompt.length,
        responseLength: responseContent.length,
        analysisType: "salesIntelligence",
      },
    });

    return responseContent;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof SalesIntelError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      const responseTimeMs = Date.now() - startTime;
      await logApiCall({
        provider: "PERPLEXITY",
        endpoint,
        method: "POST",
        statusCode: 0,
        responseTimeMs,
        success: false,
        error: "Request timeout",
        metadata: { ...context },
      });
      throw new SalesIntelError(
        "Perplexity API request timed out. Please try again.",
        "API_TIMEOUT",
        504,
      );
    }

    throw new SalesIntelError(
      `Unexpected error calling Perplexity API: ${error instanceof Error ? error.message : "Unknown error"}`,
      "UNEXPECTED_ERROR",
      500,
    );
  }
}

export const salesIntelService = {
  /**
   * Generate sales intelligence for a lead
   * Requires 1 credit per generation
   */
  async generateSalesIntel(
    leadId: string,
    userId: string,
  ): Promise<{ salesIntelligence: SalesIntelligence; creditsCharged: number }> {
    // Check rate limiting first
    checkRateLimit();

    // Get the lead with ownership check
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        userId,
      },
    });

    if (!lead) {
      throw new SalesIntelError("Lead not found", "LEAD_NOT_FOUND", 404);
    }

    // Check if user has sufficient credits
    const hasCredits = await creditsService.hasSufficientCredits(
      userId,
      SALES_INTEL_CREDIT_COST,
    );

    if (!hasCredits) {
      throw new SalesIntelError(
        `Insufficient credits. This operation requires ${SALES_INTEL_CREDIT_COST} credit(s).`,
        "INSUFFICIENT_CREDITS",
        402,
      );
    }

    // Build the prompt
    const prompt = this.buildPrompt(lead);

    // Call Perplexity API
    const responseContent = await callPerplexityApi(prompt, {
      businessName: lead.businessName,
      city: lead.city || undefined,
    });

    // Parse and validate response
    const parsedData = parseJsonResponse(responseContent);
    const salesIntelligence = validateSalesIntelResponse(parsedData);

    // Deduct credits only after successful generation
    await creditsService.deductCredits({
      userId,
      amount: SALES_INTEL_CREDIT_COST,
      type: "ANALYSIS_CHARGE",
      description: `Sales intelligence for ${lead.businessName}`,
      reference: leadId,
    });

    // Store the sales intelligence on the lead
    // Use JSON.parse/stringify to ensure Prisma Json compatibility
    const salesIntelligenceJson = JSON.parse(JSON.stringify(salesIntelligence));

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        salesIntelligence: salesIntelligenceJson,
      },
    });

    return {
      salesIntelligence,
      creditsCharged: SALES_INTEL_CREDIT_COST,
    };
  },

  /**
   * Build the prompt for sales intelligence generation
   */
  buildPrompt(lead: Lead): string {
    const websiteStatus = lead.website
      ? `Website: ${lead.website} (Lighthouse score: ${lead.lighthouseScore ?? "not analyzed"}/100)`
      : "No website";

    return `Analyze this business for B2B web services sales outreach:

- Business: ${lead.businessName}
- Category: ${lead.category}
- Location: ${lead.city || "Unknown"}${lead.state ? `, ${lead.state}` : ""}
- ${websiteStatus}
- Rating: ${lead.lighthouseScore !== null ? `${lead.lighthouseScore}/100 performance` : "Not rated"}

Provide a JSON response with:
1. overview: Brief business summary (2-3 sentences about what they do, their market position, and any notable characteristics)
2. painPoints: Array of 3-5 potential web service needs or digital pain points this business likely has (e.g., "Outdated website design hurting credibility", "Missing mobile optimization", "No online booking system")
3. outreachAngle: The single best approach for initial contact (1-2 sentences explaining the value proposition to lead with)
4. talkingPoints: Array of 3-5 key points to mention in outreach (specific, actionable items that show you understand their business)
5. recentNews: Array of any recent business updates, expansions, awards, or news (if available, otherwise empty array)

Return ONLY valid JSON with this exact structure:
{
  "overview": "string",
  "painPoints": ["string", "string", "string"],
  "outreachAngle": "string",
  "talkingPoints": ["string", "string", "string"],
  "recentNews": ["string"] or []
}`;
  },

  /**
   * Get existing sales intelligence for a lead
   */
  async getSalesIntel(
    leadId: string,
    userId: string,
  ): Promise<SalesIntelligence | null> {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        userId,
      },
      select: {
        salesIntelligence: true,
      },
    });

    if (!lead) {
      throw new SalesIntelError("Lead not found", "LEAD_NOT_FOUND", 404);
    }

    if (!lead.salesIntelligence) {
      return null;
    }

    // Cast the JSON to SalesIntelligence
    return lead.salesIntelligence as unknown as SalesIntelligence;
  },
};

export { SalesIntelError };
