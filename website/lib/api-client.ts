// API Base URL - MUST be set via NEXT_PUBLIC_API_URL in production
const API_BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL;

  if (url) return url;

  // Development fallback only
  if (process.env.NODE_ENV === "development" || typeof window === "undefined") {
    return "http://localhost:3001/api";
  }

  // In production browser, warn and try to construct from current origin
  console.error("⚠️ NEXT_PUBLIC_API_URL is not set. API calls may fail.");
  return "/api"; // Fallback to relative path (requires proxy setup)
})();

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const token = this.getToken();

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

  // Prospects
  async getProspects(params?: {
    page?: number;
    limit?: number;
    scrapeJobId?: string;
    city?: string;
    category?: string;
    hasWebsite?: string;
    minScore?: number;
    maxScore?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{ data: any[]; pagination: any }>(
      `/prospects?${searchParams}`,
    );
  }

  async getProspectStats() {
    return this.request<{
      counts: {
        prospects: number;
        leads: number;
        notInterested: number;
        archived: number;
      };
      byCategory: any[];
      byScrapeJob: any[];
    }>("/prospects/stats");
  }

  async getProspectCities() {
    return this.request<string[]>("/prospects/cities");
  }

  async getProspect(id: string) {
    return this.request<any>(`/prospects/${id}`);
  }

  async promoteProspect(id: string) {
    return this.request(`/prospects/${id}/promote`, { method: "POST" });
  }

  async markProspectNotInterested(id: string, reason?: string) {
    return this.request(`/prospects/${id}/not-interested`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async archiveProspect(id: string) {
    return this.request(`/prospects/${id}/archive`, { method: "POST" });
  }

  async deleteProspect(id: string) {
    return this.request(`/prospects/${id}`, { method: "DELETE" });
  }

  async bulkPromoteProspects(ids: string[]) {
    return this.request<{ count: number }>("/prospects/bulk/promote", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  async bulkDeleteProspects(ids: string[]) {
    return this.request<{ count: number }>("/prospects/bulk/delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  async bulkMarkNotInterested(ids: string[], reason?: string) {
    return this.request<{ count: number }>("/prospects/bulk/not-interested", {
      method: "POST",
      body: JSON.stringify({ ids, reason }),
    });
  }

  // ===== Perplexity Enhanced Features =====

  // Deep research a prospect for comprehensive sales intelligence
  async deepResearchProspect(prospectId: string) {
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
      body: JSON.stringify({ prospectId }),
    });
  }

  // Deep research a business by name (without existing prospect)
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

  // Find decision makers for a prospect
  async findDecisionMakers(prospectId: string) {
    return this.request<{
      decisionMakers: Array<{
        name: string;
        title?: string;
        email?: string;
        linkedin?: string;
      }>;
    }>("/scraping/perplexity/decision-makers", {
      method: "POST",
      body: JSON.stringify({ prospectId }),
    });
  }

  // Generate personalized outreach email for a prospect
  async generateOutreachEmail(prospectId: string) {
    return this.request<{
      subject: string;
      body: string;
    }>("/scraping/perplexity/generate-email", {
      method: "POST",
      body: JSON.stringify({ prospectId }),
    });
  }

  // ===== Website Analysis =====

  // Rerun Lighthouse analysis on a lead/prospect
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
}

export const apiClient = new ApiClient();
