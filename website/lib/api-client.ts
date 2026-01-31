// API Base URL - MUST be set via NEXT_PUBLIC_API_URL in production
const API_BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL;

  if (url) return url;

  // Development fallback only
  if (process.env.NODE_ENV === "development" || typeof window === "undefined") {
    return "http://localhost:3001/api";
  }

  // In production browser, warn and try to construct from current origin
  console.error("NEXT_PUBLIC_API_URL is not set. API calls may fail.");
  return "/api"; // Fallback to relative path (requires proxy setup)
})();

// Admin API prefix - MUST match backend ADMIN_URL_PREFIX
// SECURITY: This obscure URL prefix prevents unauthorized access attempts to admin endpoints
// Change this periodically and keep it secret
const ADMIN_API_PREFIX = process.env.NEXT_PUBLIC_ADMIN_PREFIX || "nucleus-admin-x7k9m2";

// Clerk token getter - set by the auth provider
let clerkGetToken: (() => Promise<string | null>) | null = null;

/**
 * Set the Clerk token getter function
 * This should be called from a component that has access to Clerk's useAuth hook
 */
export function setClerkTokenGetter(getter: () => Promise<string | null>) {
  clerkGetToken = getter;
}

class ApiClient {
  /**
   * Get authentication token
   * Prefers Clerk token if available, falls back to localStorage for legacy support
   */
  private async getToken(): Promise<string | null> {
    // Try Clerk token first
    if (clerkGetToken) {
      try {
        const clerkToken = await clerkGetToken();
        if (clerkToken) {
          return clerkToken;
        }
      } catch (error) {
        console.error("Failed to get Clerk token:", error);
      }
    }

    // Fall back to legacy localStorage token
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = await this.getToken();

    // Only set Content-Type for requests with a body
    const hasBody = options.body !== undefined;
    const headers: HeadersInit = {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error) {
      // Network error - server is likely not running
      throw new Error(
        "Unable to connect to server. Please make sure the backend is running on port 3001.",
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      if (response.status === 403) {
        throw new Error("You do not have permission to perform this action.");
      }
      if (response.status === 404) {
        throw new Error("The requested resource was not found.");
      }
      // For all errors (including 500), try to get the actual error message from response
      const errorData = await response
        .json()
        .catch(() => ({ error: "Request failed" }));
      throw new Error(errorData.error || errorData.message || "Request failed");
    }

    return response.json();
  }

  // Public request (no auth token)
  private async publicRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error) {
      throw new Error(
        "Unable to connect to server. Please make sure the backend is running on port 3001.",
      );
    }

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("The requested resource was not found.");
      }
      // For all errors (including 500), try to get the actual error message from response
      const errorData = await response
        .json()
        .catch(() => ({ error: "Request failed" }));
      throw new Error(errorData.error || errorData.message || "Request failed");
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    // Clear any stale token before login attempt
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }

    const data = await this.publicRequest<{ token: string; user: any }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );
    localStorage.setItem("token", data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>("/auth/me");
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Leads
  async getLeads(params?: {
    page?: number;
    limit?: number;
    stage?: string;
    category?: string;
    priority?: string;
    city?: string;
    hasWebsite?: string;
    minScore?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{ data: any[]; pagination: any }>(
      `/leads?${searchParams}`,
    );
  }

  async getLead(id: string) {
    return this.request<any>(`/leads/${id}`);
  }

  async createLead(data: any) {
    return this.request("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateLead(id: string, data: any) {
    return this.request(`/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteLead(id: string) {
    return this.request(`/leads/${id}`, {
      method: "DELETE",
    });
  }

  async changeLeadStage(id: string, stage: string, notes?: string) {
    return this.request(`/leads/${id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage, notes }),
    });
  }

  async assignLead(id: string, userId: string | null) {
    return this.request(`/leads/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  // Activities
  async getActivities(params?: {
    leadId?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{ data: any[]; pagination: any }>(
      `/activities?${searchParams}`,
    );
  }

  async createActivity(data: any) {
    return this.request("/activities", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async completeActivity(id: string, outcome?: string) {
    return this.request(`/activities/${id}/complete`, {
      method: "POST",
      body: JSON.stringify({ outcome }),
    });
  }

  async getLeadActivities(leadId: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      data: Array<{
        id: string;
        type: string;
        title: string;
        description: string | null;
        outcome: string | null;
        scheduledAt: string | null;
        completedAt: string | null;
        createdAt: string;
        user: { id: string; name: string };
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/leads/${leadId}/activities?${searchParams}`);
  }

  async updateActivity(id: string, data: {
    title?: string;
    description?: string;
    outcome?: string;
    scheduledAt?: string;
  }) {
    return this.request(`/activities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteActivity(id: string) {
    return this.request(`/activities/${id}`, {
      method: "DELETE",
    });
  }

  // Tags
  async getTags() {
    return this.request<any[]>("/tags");
  }

  async createTag(data: { name: string; color?: string }) {
    return this.request("/tags", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id: string) {
    return this.request(`/tags/${id}`, {
      method: "DELETE",
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<any>("/dashboard/stats");
  }

  async getPipelineCounts() {
    return this.request<any[]>("/dashboard/pipeline");
  }

  async getLeadsByCategory() {
    return this.request<any[]>("/dashboard/by-category");
  }

  async getRecentActivities() {
    return this.request<any[]>("/dashboard/recent-activities");
  }

  async getLeadsOverTime() {
    return this.request<any[]>("/dashboard/leads-over-time");
  }

  async getConversionRates() {
    return this.request<any>("/dashboard/conversion-rates");
  }

  // Scraping
  async getScrapeJobs(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{ data: any[]; pagination: any }>(
      `/scraping/jobs?${searchParams}`,
    );
  }

  async getScrapeJob(id: string) {
    return this.request<any>(`/scraping/jobs/${id}`);
  }

  async createScrapeJob(data: {
    type: string;
    query: string;
    location?: string;
    category?: string;
    regionId?: string;
    maxResults?: number;
  }) {
    return this.request("/scraping/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async cancelScrapeJob(id: string) {
    return this.request(`/scraping/jobs/${id}/cancel`, {
      method: "POST",
    });
  }

  async getScrapingStats() {
    return this.request<any>("/scraping/stats");
  }

  // Regions
  async getRegions() {
    return this.request<any[]>("/regions");
  }

  async createRegion(data: { name: string; cities: string[]; state?: string }) {
    return this.request("/regions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateRegion(id: string, data: any) {
    return this.request(`/regions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteRegion(id: string) {
    return this.request(`/regions/${id}`, {
      method: "DELETE",
    });
  }

  async toggleRegion(id: string) {
    return this.request(`/regions/${id}/toggle`, {
      method: "POST",
    });
  }

  // Contact Form (public - no auth required)
  async submitContactForm(data: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    service?: string;
    budget?: string;
    message: string;
  }) {
    return this.publicRequest<{
      success: boolean;
      message: string;
      id: string;
    }>("/contact/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Contact submissions (admin - auth required)
  async getContactSubmissions(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      submissions: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/contact?${searchParams}`);
  }

  async getContactSubmission(id: string) {
    return this.request<any>(`/contact/${id}`);
  }

  async updateContactSubmission(
    id: string,
    data: { status?: string; notes?: string },
  ) {
    return this.request(`/contact/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteContactSubmission(id: string) {
    return this.request(`/contact/${id}`, {
      method: "DELETE",
    });
  }

  async getContactStats() {
    return this.request<{
      total: number;
      new: number;
      read: number;
      replied: number;
      archived: number;
    }>("/contact/stats");
  }

  // Zones
  async getZones(params?: { city?: string; type?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      cities: Array<{
        name: string;
        state: string;
        zones: Array<{
          name: string;
          lat: number;
          lng: number;
          radiusKm: number;
          type: string;
          businessTypes: string[];
          priority: number;
          description?: string;
        }>;
        totalZones: number;
        zonesByType: Record<string, number>;
      }>;
      businessTypes: string[];
      summary: { totalCities: number; totalZones: number };
    }>(`/scraping/zones?${searchParams}`);
  }

  async getZonesSummary() {
    return this.request<{
      cities: Array<{
        name: string;
        state: string;
        totalZones: number;
        zonesByType: Record<string, number>;
        topZones: Array<{ name: string; priority: number; type: string }>;
      }>;
      totalZones: number;
      businessTypes: number;
    }>("/scraping/zones/summary");
  }

  // API Logs
  async getApiLogsStats(params?: {
    startDate?: string;
    endDate?: string;
    provider?: string;
    scrapeJobId?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      totalCalls: number;
      successfulCalls: number;
      failedCalls: number;
      totalCost: number;
      byProvider: Record<
        string,
        { calls: number; cost: number; errors: number }
      >;
    }>(`/scraping/api-logs/stats?${searchParams}`);
  }

  async getRecentApiLogs(limit: number = 100) {
    return this.request<{
      logs: Array<{
        id: string;
        provider: string;
        endpoint: string;
        statusCode: number;
        responseTimeMs: number;
        success: boolean;
        error: string | null;
        estimatedCost: number | null;
        createdAt: string;
        scrapeJobId: string | null;
        metadata: string | null; // JSON string with details
      }>;
    }>(`/scraping/api-logs/recent?limit=${limit}`);
  }

  // ===== Perplexity Enhanced Features =====

  // Deep research a lead for comprehensive sales intelligence
  async deepResearchLead(leadId: string) {
    return this.request<{
      email?: string;
      phone?: string;
      website?: string;
      ownerName?: string;
      hasWebsite: boolean;
      decisionMakers?: Array<{
        name: string;
        title?: string;
        email?: string;
        linkedin?: string;
      }>;
      companySize?: string;
      estimatedRevenue?: string;
      foundedYear?: number;
      industry?: string;
      specializations?: string[];
      painPoints?: string[];
      webServiceNeeds?: string[];
      recentNews?: string[];
      competitorWebsites?: string[];
      personalizedPitch?: string;
      rawAnalysis?: string;
    }>("/scraping/perplexity/deep-research", {
      method: "POST",
      body: JSON.stringify({ prospectId: leadId }),
    });
  }

  // Deep research a business by name (without existing lead)
  async deepResearchBusiness(business: {
    name: string;
    address?: string;
    city?: string;
    website?: string;
    category?: string;
  }) {
    return this.request<{
      email?: string;
      phone?: string;
      website?: string;
      ownerName?: string;
      hasWebsite: boolean;
      decisionMakers?: Array<{
        name: string;
        title?: string;
        email?: string;
        linkedin?: string;
      }>;
      companySize?: string;
      estimatedRevenue?: string;
      foundedYear?: number;
      industry?: string;
      specializations?: string[];
      painPoints?: string[];
      webServiceNeeds?: string[];
      recentNews?: string[];
      competitorWebsites?: string[];
      personalizedPitch?: string;
      rawAnalysis?: string;
    }>("/scraping/perplexity/deep-research", {
      method: "POST",
      body: JSON.stringify({ business }),
    });
  }

  // Find decision makers for a lead
  async findDecisionMakers(leadId: string) {
    return this.request<{
      decisionMakers: Array<{
        name: string;
        title?: string;
        email?: string;
        linkedin?: string;
      }>;
    }>("/scraping/perplexity/decision-makers", {
      method: "POST",
      body: JSON.stringify({ prospectId: leadId }),
    });
  }

  // Generate personalized outreach email for a lead
  async generateOutreachEmail(leadId: string) {
    return this.request<{
      subject: string;
      body: string;
    }>("/scraping/perplexity/generate-email", {
      method: "POST",
      body: JSON.stringify({ prospectId: leadId }),
    });
  }

  // ===== Website Analysis =====

  // Rerun Lighthouse analysis on a lead
  async rerunLighthouse(leadId: string) {
    return this.request<{
      success: boolean;
      results?: {
        performance: number;
        seo: number;
        accessibility: number;
        bestPractices: number;
      };
      error?: string;
      redirected?: boolean;
      finalUrl?: string;
      originalUrl?: string;
      domainStatus?: "active" | "expired" | "parked" | "error";
      statusMessage?: string;
    }>("/scraping/analyze/lighthouse", {
      method: "POST",
      body: JSON.stringify({ leadId }),
    });
  }

  // Detect technology stack of a website
  async detectTechStack(leadId: string) {
    return this.request<{
      cms?: string;
      framework?: string;
      hosting?: string;
      ecommerce?: string;
      analytics?: string[];
      marketing?: string[];
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
      seoTools?: string[];
      socialIntegrations?: string[];
      paymentGateways?: string[];
      chatbots?: string[];
      otherTechnologies?: string[];
      recommendations?: string[];
    }>("/scraping/analyze/tech-stack", {
      method: "POST",
      body: JSON.stringify({ leadId }),
    });
  }

  // ===== Map-Based Scraping =====

  // Estimate scraping costs for a geographic region
  async estimateScrapingRegion(bounds: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number };
  }) {
    return this.request<{
      cellCount: number;
      estimatedLeads: number;
      estimatedCredits: number;
      areaKm2: number;
    }>("/scraping/estimate", {
      method: "POST",
      body: JSON.stringify({ bounds }),
    });
  }

  // Create scrape job with geographic bounds
  async createScrapeJobWithBounds(data: {
    type: string;
    query: string;
    bounds: {
      ne: { lat: number; lng: number };
      sw: { lat: number; lng: number };
    };
    category?: string;
    maxResults?: number;
    filters?: {
      hasWebsite?: boolean;
      hasEmail?: boolean;
      hasPhone?: boolean;
      minRating?: number;
      minReviews?: number;
    };
  }) {
    return this.request("/scraping/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ===== Admin Panel =====
  // SECURITY: All admin API endpoints use the obscure URL prefix

  // Admin Users
  async getAdminUsers(params?: { search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      users: Array<{
        id: string;
        email: string;
        name: string;
        role: string;
        isActive: boolean;
        creditBalance: number;
        createdAt: string;
        updatedAt: string;
        _count: {
          ownedLeads: number;
          scrapeJobs: number;
          creditTransactions: number;
        };
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/${ADMIN_API_PREFIX}/users?${searchParams}`);
  }

  async getAdminUserDetails(userId: string) {
    return this.request<{
      id: string;
      email: string;
      name: string;
      role: string;
      isActive: boolean;
      creditBalance: number;
      createdAt: string;
      updatedAt: string;
      _count: {
        ownedLeads: number;
        scrapeJobs: number;
        creditTransactions: number;
      };
      recentTransactions: Array<{
        id: string;
        amount: number;
        type: string;
        description: string | null;
        reference: string | null;
        createdAt: string;
      }>;
      recentScrapeJobs: Array<{
        id: string;
        type: string;
        query: string;
        status: string;
        leadsCreated: number;
        createdAt: string;
      }>;
    }>(`/${ADMIN_API_PREFIX}/users/${userId}`);
  }

  async getAdminUserActivity(userId: string) {
    return this.request<{
      activityTimeline: Array<{
        date: string;
        scrapeJobs: number;
        leadsCreated: number;
        creditsUsed: number;
      }>;
      creditBurnRate: {
        daily: number;
        weekly: number;
      };
      lastActive: string | null;
      apiUsage: {
        total: number;
        last30Days: number;
      };
    }>(`/${ADMIN_API_PREFIX}/users/${userId}/activity`);
  }

  async updateAdminUser(
    userId: string,
    data: {
      name?: string;
      isActive?: boolean;
      role?: "ADMIN" | "USER";
      creditBalance?: number;
    }
  ) {
    return this.request(`/${ADMIN_API_PREFIX}/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async addUserCredits(userId: string, amount: number, reason: string) {
    return this.request<{ message: string; newBalance: number }>(
      `/${ADMIN_API_PREFIX}/users/${userId}/credits`,
      {
        method: "POST",
        body: JSON.stringify({ amount, reason }),
      }
    );
  }

  async deductUserCredits(userId: string, amount: number, reason: string) {
    return this.request<{ message: string; newBalance: number }>(
      `/${ADMIN_API_PREFIX}/users/${userId}/credits/deduct`,
      {
        method: "POST",
        body: JSON.stringify({ amount, reason }),
      }
    );
  }

  // Admin Analytics
  async getAdminAnalyticsOverview() {
    return this.request<{
      totalUsers: number;
      activeUsers: number;
      totalLeads: number;
      totalCreditsUsed: number;
      totalCreditsAdded: number;
      activeJobs: number;
      completedJobs: number;
    }>(`/${ADMIN_API_PREFIX}/analytics/overview`);
  }

  async getAdminUserGrowth(days?: number) {
    const params = days ? `?days=${days}` : "";
    return this.request<Array<{ date: string; count: number }>>(
      `/${ADMIN_API_PREFIX}/analytics/users${params}`
    );
  }

  async getAdminCreditUsage(days?: number) {
    const params = days ? `?days=${days}` : "";
    return this.request<Array<{ date: string; used: number; added: number }>>(
      `/${ADMIN_API_PREFIX}/analytics/usage${params}`
    );
  }

  async getAdminLeadGrowth(days?: number) {
    const params = days ? `?days=${days}` : "";
    return this.request<Array<{ date: string; count: number }>>(
      `/${ADMIN_API_PREFIX}/analytics/leads${params}`
    );
  }

  async getAdminTopUsers(limit?: number) {
    const params = limit ? `?limit=${limit}` : "";
    return this.request<
      Array<{
        id: string;
        name: string;
        email: string;
        leadsCount: number;
        creditsUsed: number;
      }>
    >(`/${ADMIN_API_PREFIX}/analytics/top-users${params}`);
  }

  async getAdminScrapeJobStats(days?: number) {
    const params = days ? `?days=${days}` : "";
    return this.request<{
      totalJobs: number;
      successRate: number;
      avgLeadsPerJob: number;
      byStatus: Array<{ status: string; count: number }>;
      byType: Array<{ type: string; count: number }>;
    }>(`/${ADMIN_API_PREFIX}/analytics/scrape-jobs${params}`);
  }

  async getAdminCategoryDistribution() {
    return this.request<Array<{ category: string; count: number }>>(
      `/${ADMIN_API_PREFIX}/analytics/categories`
    );
  }

  async getAdminGeographicDistribution() {
    return this.request<{
      cities: Array<{ city: string; count: number }>;
      states: Array<{ state: string; count: number }>;
    }>(`/${ADMIN_API_PREFIX}/analytics/geography`);
  }

  // Get all saved regions across all users (admin only)
  async getAdminSavedRegions() {
    return this.request<{
      regions: Array<{
        id: string;
        userId: string;
        name: string;
        southwestLat: number;
        southwestLng: number;
        northeastLat: number;
        northeastLng: number;
        lastUsed: string;
        timesUsed: number;
        createdAt: string;
        user: {
          id: string;
          name: string;
          email: string;
        };
      }>;
    }>(`/${ADMIN_API_PREFIX}/saved-regions`);
  }

  // Get system health metrics (admin only)
  async getAdminHealthMetrics() {
    return this.request<{
      queue: {
        active: number;
        pending: number;
        completed: number;
        failed: number;
      };
      system: {
        uptime: number;
        uptimeFormatted: string;
        memoryUsed: number;
        memoryTotal: number;
        memoryPercent: number;
      };
      api: {
        errorRate: number;
        avgResponseTime: number;
      };
    }>(`/${ADMIN_API_PREFIX}/health-metrics`);
  }

  // ===== Admin Jobs (Job Monitor) =====

  async getAdminJobs(params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      jobs: Array<{
        id: string;
        type: string;
        query: string;
        location: string | null;
        category: string | null;
        status: string;
        leadsFound: number;
        leadsCreated: number;
        leadsDuplicate: number;
        leadsSkipped: number;
        createdAt: string;
        startedAt: string | null;
        completedAt: string | null;
        region: { id: string; name: string } | null;
        createdBy: { id: string; name: string; email: string };
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/${ADMIN_API_PREFIX}/jobs?${searchParams}`);
  }

  async getAdminJobStats() {
    return this.request<{
      total: number;
      pending: number;
      running: number;
      completed: number;
      failed: number;
      last24h: { jobs: number; leadsCreated: number };
    }>(`/${ADMIN_API_PREFIX}/jobs/stats`);
  }

  // ===== Admin Coupons =====

  async getAdminCoupons(params?: { includeInactive?: boolean }) {
    const searchParams = new URLSearchParams();
    if (params?.includeInactive) {
      searchParams.set("includeInactive", "true");
    }
    return this.request<
      Array<{
        id: string;
        code: string;
        creditAmount: number;
        maxUses: number | null;
        currentUses: number;
        expiresAt: string | null;
        isActive: boolean;
        createdAt: string;
        createdBy: { id: string; name: string; email: string };
      }>
    >(`/admin/coupons?${searchParams}`);
  }

  async getAdminCouponStats() {
    return this.request<{
      totalCoupons: number;
      activeCoupons: number;
      totalRedemptions: number;
      totalCreditsDistributed: number;
    }>(`/admin/coupons/stats`);
  }

  async getAdminCoupon(id: string) {
    return this.request<{
      id: string;
      code: string;
      creditAmount: number;
      maxUses: number | null;
      currentUses: number;
      expiresAt: string | null;
      isActive: boolean;
      createdAt: string;
      createdBy: { id: string; name: string; email: string };
      redemptions: Array<{
        id: string;
        userId: string;
        redeemedAt: string;
        user: { name: string; email: string };
      }>;
    }>(`/admin/coupons/${id}`);
  }

  async createAdminCoupon(data: {
    code: string;
    creditAmount: number;
    maxUses?: number | null;
    expiresAt?: string | null;
  }) {
    return this.request<{
      id: string;
      code: string;
      creditAmount: number;
    }>(`/admin/coupons`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async activateAdminCoupon(id: string) {
    return this.request(`/admin/coupons/${id}/activate`, {
      method: "PATCH",
    });
  }

  async deactivateAdminCoupon(id: string) {
    return this.request(`/admin/coupons/${id}/deactivate`, {
      method: "PATCH",
    });
  }

  async deleteAdminCoupon(id: string) {
    return this.request<{ message: string }>(`/admin/coupons/${id}`, {
      method: "DELETE",
    });
  }

  // ===== Coupons (User) =====

  async redeemCoupon(code: string) {
    return this.request<{
      message: string;
      creditsAdded: number;
      newBalance: number;
    }>("/coupons/redeem", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  async validateCoupon(code: string) {
    return this.request<{
      valid: boolean;
      creditAmount?: number;
      error?: string;
    }>("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  // ===== Credits =====

  async getCreditHistory(params?: { limit?: number; offset?: number; type?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      transactions: Array<{
        id: string;
        amount: number;
        type: string;
        description: string | null;
        reference: string | null;
        createdAt: string;
      }>;
      total: number;
      limit: number;
      offset: number;
    }>(`/credits/history?${searchParams}`);
  }

  async getMonthlyCreditsStats() {
    return this.request<{
      creditsUsed: number;
      leadsScraped: number;
      transactionCount: number;
    }>("/credits/monthly-stats");
  }

  // ===== GDPR / Privacy =====

  /**
   * Export all user data (GDPR Article 20 - Data Portability)
   * Returns a JSON file with all user data
   */
  async exportUserData(): Promise<Blob> {
    const token = await this.getToken();

    const response = await fetch(`${API_BASE_URL}/user/export`, {
      method: "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      const errorData = await response
        .json()
        .catch(() => ({ error: "Export failed" }));
      throw new Error(errorData.error || errorData.message || "Export failed");
    }

    return response.blob();
  }

  /**
   * Request account deletion (GDPR Article 17 - Right to Erasure)
   * Initiates deletion process with grace period
   */
  async requestAccountDeletion(reason?: string): Promise<{
    message: string;
    deletionScheduledFor: string;
    gracePeriodDays: number;
  }> {
    return this.request("/user/delete", {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Cancel a pending account deletion request
   */
  async cancelAccountDeletion(): Promise<{ message: string }> {
    return this.request("/user/delete/cancel", {
      method: "POST",
    });
  }

  // ===== Saved Regions =====

  /**
   * Get list of user's saved regions
   */
  async getSavedRegions(params?: {
    limit?: number;
    offset?: number;
    sortBy?: "lastUsed" | "timesUsed" | "createdAt" | "name";
    sortOrder?: "asc" | "desc";
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      regions: Array<{
        id: string;
        userId: string;
        name: string;
        southwestLat: number;
        southwestLng: number;
        northeastLat: number;
        northeastLng: number;
        lastUsed: string;
        timesUsed: number;
        createdAt: string;
      }>;
      total: number;
      limit: number;
      offset: number;
    }>(`/saved-regions?${searchParams}`);
  }

  /**
   * Get recently used saved regions (for quick selection dropdown)
   */
  async getRecentSavedRegions() {
    return this.request<{
      regions: Array<{
        id: string;
        userId: string;
        name: string;
        southwestLat: number;
        southwestLng: number;
        northeastLat: number;
        northeastLng: number;
        lastUsed: string;
        timesUsed: number;
        createdAt: string;
      }>;
    }>("/saved-regions/recent");
  }

  /**
   * Get a single saved region by ID
   */
  async getSavedRegion(id: string) {
    return this.request<{
      id: string;
      userId: string;
      name: string;
      southwestLat: number;
      southwestLng: number;
      northeastLat: number;
      northeastLng: number;
      lastUsed: string;
      timesUsed: number;
      createdAt: string;
    }>(`/saved-regions/${id}`);
  }

  /**
   * Create a new saved region
   */
  async createSavedRegion(data: {
    name: string;
    southwestLat: number;
    southwestLng: number;
    northeastLat: number;
    northeastLng: number;
  }) {
    return this.request<{
      id: string;
      userId: string;
      name: string;
      southwestLat: number;
      southwestLng: number;
      northeastLat: number;
      northeastLng: number;
      lastUsed: string;
      timesUsed: number;
      createdAt: string;
    }>("/saved-regions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a saved region's name
   */
  async updateSavedRegion(id: string, data: { name: string }) {
    return this.request<{
      id: string;
      userId: string;
      name: string;
      southwestLat: number;
      southwestLng: number;
      northeastLat: number;
      northeastLng: number;
      lastUsed: string;
      timesUsed: number;
      createdAt: string;
    }>(`/saved-regions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a saved region
   */
  async deleteSavedRegion(id: string) {
    return this.request<{ success: boolean; message: string }>(
      `/saved-regions/${id}`,
      {
        method: "DELETE",
      }
    );
  }

  /**
   * Mark a saved region as used (updates lastUsed and increments timesUsed)
   */
  async markSavedRegionAsUsed(id: string) {
    return this.request<{
      id: string;
      userId: string;
      name: string;
      southwestLat: number;
      southwestLng: number;
      northeastLat: number;
      northeastLng: number;
      lastUsed: string;
      timesUsed: number;
      createdAt: string;
    }>(`/saved-regions/${id}/use`, {
      method: "POST",
    });
  }

  // ===== Reminders =====

  /**
   * Get user's reminders with optional filters
   */
  async getReminders(params?: {
    page?: number;
    limit?: number;
    status?: "PENDING" | "COMPLETED" | "DISMISSED";
    leadId?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      data: Array<{
        id: string;
        leadId: string;
        remindAt: string;
        note: string | null;
        status: "PENDING" | "COMPLETED" | "DISMISSED";
        createdAt: string;
        lead: {
          id: string;
          businessName: string;
          email: string | null;
          phone: string | null;
          city: string | null;
          stage: string;
        };
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/reminders?${searchParams}`);
  }

  /**
   * Get reminders due today
   */
  async getDueReminders() {
    return this.request<{
      data: Array<{
        id: string;
        leadId: string;
        remindAt: string;
        note: string | null;
        status: "PENDING" | "COMPLETED" | "DISMISSED";
        createdAt: string;
        lead: {
          id: string;
          businessName: string;
          email: string | null;
          phone: string | null;
          city: string | null;
          stage: string;
        };
      }>;
      count: number;
    }>("/reminders/due");
  }

  /**
   * Get count of reminders due today (for dashboard widget)
   */
  async getDueRemindersCount() {
    return this.request<{ count: number }>("/reminders/due/count");
  }

  /**
   * Get a single reminder by ID
   */
  async getReminder(id: string) {
    return this.request<{
      id: string;
      leadId: string;
      remindAt: string;
      note: string | null;
      status: "PENDING" | "COMPLETED" | "DISMISSED";
      createdAt: string;
      lead: {
        id: string;
        businessName: string;
        email: string | null;
        phone: string | null;
        city: string | null;
        stage: string;
      };
    }>(`/reminders/${id}`);
  }

  /**
   * Get all reminders for a specific lead
   */
  async getLeadReminders(leadId: string) {
    return this.request<{
      data: Array<{
        id: string;
        remindAt: string;
        note: string | null;
        status: "PENDING" | "COMPLETED" | "DISMISSED";
        createdAt: string;
      }>;
    }>(`/reminders/lead/${leadId}`);
  }

  /**
   * Create a new reminder
   */
  async createReminder(data: { leadId: string; remindAt: string; note?: string }) {
    return this.request<{
      id: string;
      leadId: string;
      remindAt: string;
      note: string | null;
      status: "PENDING" | "COMPLETED" | "DISMISSED";
      createdAt: string;
      lead: {
        id: string;
        businessName: string;
        email: string | null;
        phone: string | null;
        city: string | null;
        stage: string;
      };
    }>("/reminders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a reminder
   */
  async updateReminder(
    id: string,
    data: {
      remindAt?: string;
      note?: string;
      status?: "PENDING" | "COMPLETED" | "DISMISSED";
    }
  ) {
    return this.request<{
      id: string;
      leadId: string;
      remindAt: string;
      note: string | null;
      status: "PENDING" | "COMPLETED" | "DISMISSED";
      createdAt: string;
      lead: {
        id: string;
        businessName: string;
        email: string | null;
        phone: string | null;
        city: string | null;
        stage: string;
      };
    }>(`/reminders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Mark a reminder as completed
   */
  async completeReminder(id: string) {
    return this.request<{
      id: string;
      leadId: string;
      remindAt: string;
      note: string | null;
      status: "PENDING" | "COMPLETED" | "DISMISSED";
      createdAt: string;
    }>(`/reminders/${id}/complete`, {
      method: "POST",
    });
  }

  /**
   * Dismiss a reminder
   */
  async dismissReminder(id: string) {
    return this.request<{
      id: string;
      leadId: string;
      remindAt: string;
      note: string | null;
      status: "PENDING" | "COMPLETED" | "DISMISSED";
      createdAt: string;
    }>(`/reminders/${id}/dismiss`, {
      method: "POST",
    });
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(id: string) {
    return this.request<{ message: string }>(`/reminders/${id}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient();
