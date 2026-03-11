// API Base URL - MUST be set via NEXT_PUBLIC_API_URL in production
const API_BASE_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL;

  if (url) return url;

  // Development fallback only
  if (process.env.NODE_ENV === "development" || typeof window === "undefined") {
    return "http://localhost:3002/api/v1";
  }

  // In production browser, warn and try to construct from current origin
  console.error("NEXT_PUBLIC_API_URL is not set. API calls may fail.");
  return "/api"; // Fallback to relative path (requires proxy setup)
})();

// Admin API prefix - MUST match backend ADMIN_URL_PREFIX
// SECURITY: This obscure URL prefix prevents unauthorized access attempts to admin endpoints
// Change this periodically and keep it secret
const ADMIN_API_PREFIX = process.env.NEXT_PUBLIC_ADMIN_PREFIX || "nucleus-admin-x7k9m2";

class ApiClient {
  /**
   * Get authentication token from localStorage
   */
  private async getToken(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("lg_token");
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
        "Unable to connect to server. Please make sure the backend is running on port 3002.",
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
        "Unable to connect to server. Please make sure the backend is running on port 3002.",
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

  async updateTag(id: string, data: { name?: string; color?: string }) {
    return this.request(`/tags/${id}`, {
      method: "PATCH",
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
        createdAt: string;
        updatedAt: string;
        _count: {
          curatedPOIs: number;
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
      createdAt: string;
      updatedAt: string;
      _count: {
        curatedPOIs: number;
      };
      recentActivity: Array<{
        id: string;
        type: string;
        description: string | null;
        createdAt: string;
      }>;
    }>(`/${ADMIN_API_PREFIX}/users/${userId}`);
  }

  async getAdminUserActivity(userId: string) {
    return this.request<{
      activityTimeline: Array<{
        date: string;
        poisCreated: number;
      }>;
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
    }
  ) {
    return this.request(`/${ADMIN_API_PREFIX}/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
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

  // ===== Local Guide: Cities =====

  async getCities(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
    }>(`/cities?${searchParams}`);
  }

  async getCityBySlug(slug: string) {
    return this.request<{ data: any }>(`/cities/${slug}`);
  }

  async createCity(data: Record<string, unknown>) {
    return this.request<{ data: any }>("/cities", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCity(id: string, data: Record<string, unknown>) {
    return this.request<{ data: any }>(`/cities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async updateCityStatus(id: string, status: string) {
    return this.request<{ data: any }>(`/cities/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  // ===== Local Guide: Themes =====

  async getCityTheme(cityId: string) {
    return this.request<{ data: any }>(`/cities/${cityId}/theme`);
  }

  async upsertCityTheme(cityId: string, data: Record<string, unknown>) {
    return this.request<{ data: any }>(`/cities/${cityId}/theme`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ===== Local Guide: Categories =====

  async getCategories(params?: { cityId?: string; isGlobal?: boolean; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
    }>(`/categories?${searchParams}`);
  }

  async createCategory(data: Record<string, unknown>) {
    return this.request<{ data: any }>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: Record<string, unknown>) {
    return this.request<{ data: any }>(`/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string) {
    return this.request<{ data: any }>(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // ===== Local Guide: POIs =====

  async getCityPOIs(cityId: string, params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
    }>(`/cities/${cityId}/pois?${searchParams}`);
  }

  async getCityPOIStats(cityId: string) {
    return this.request<{ data: any }>(`/cities/${cityId}/pois/stats`);
  }

  async getReviewQueue(cityId: string, params?: { page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
    }>(`/cities/${cityId}/pois/review-queue?${searchParams}`);
  }

  async getPOI(id: string) {
    return this.request<{ data: any }>(`/pois/${id}`);
  }

  async createPOI(data: Record<string, unknown>) {
    return this.request<{ data: any }>("/pois", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePOI(id: string, data: Record<string, unknown>) {
    return this.request<{ data: any }>(`/pois/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async approvePOI(id: string) {
    return this.request<{ data: any }>(`/pois/${id}/approve`, {
      method: "POST",
    });
  }

  async rejectPOI(id: string, reason: string) {
    return this.request<{ data: any }>(`/pois/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async publishPOI(id: string) {
    return this.request<{ data: any }>(`/pois/${id}/publish`, {
      method: "POST",
    });
  }

  // ===== Local Guide: POI Photos =====

  async getPOIPhotos(poiId: string) {
    return this.request<{ data: any[] }>(`/pois/${poiId}/photos`);
  }

  async addPOIPhoto(poiId: string, data: { url: string; caption?: string; isPrimary?: boolean }) {
    return this.request<{ data: any }>(`/pois/${poiId}/photos`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async deletePOIPhoto(photoId: string) {
    return this.request<{ data: any }>(`/photos/${photoId}`, {
      method: "DELETE",
    });
  }

  // ===== Local Guide: Places Search =====

  async searchPlaces(query: string, bounds: { northLat: number; southLat: number; eastLng: number; westLng: number }) {
    return this.request<{ data: any[] }>("/places/search", {
      method: "POST",
      body: JSON.stringify({ query, bounds }),
    });
  }

  // ===== Local Guide: Itineraries =====

  async getCityItineraries(cityId: string, params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
    }>(`/cities/${cityId}/itineraries?${searchParams}`);
  }

  async getItinerary(id: string) {
    return this.request<{ data: any }>(`/itineraries/${id}`);
  }

  async createItinerary(data: Record<string, unknown>) {
    return this.request<{ data: any }>("/itineraries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateItinerary(id: string, data: Record<string, unknown>) {
    return this.request<{ data: any }>(`/itineraries/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteItinerary(id: string) {
    return this.request<{ data: any }>(`/itineraries/${id}`, {
      method: "DELETE",
    });
  }

  async addItineraryStop(itineraryId: string, data: Record<string, unknown>) {
    return this.request<{ data: any }>(`/itineraries/${itineraryId}/stops`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async removeItineraryStop(stopId: string) {
    return this.request<{ data: any }>(`/itinerary-stops/${stopId}`, {
      method: "DELETE",
    });
  }

  // ===== Local Guide: Collections =====

  async getCityCollections(cityId: string, params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
    }>(`/cities/${cityId}/collections?${searchParams}`);
  }

  async getCollection(id: string) {
    return this.request<{ data: any }>(`/collections/${id}`);
  }

  async createCollection(data: Record<string, unknown>) {
    return this.request<{ data: any }>("/collections", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCollection(id: string, data: Record<string, unknown>) {
    return this.request<{ data: any }>(`/collections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteCollection(id: string) {
    return this.request<{ data: any }>(`/collections/${id}`, {
      method: "DELETE",
    });
  }

  async addCollectionItem(collectionId: string, data: Record<string, unknown>) {
    return this.request<{ data: any }>(`/collections/${collectionId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async removeCollectionItem(itemId: string) {
    return this.request<{ data: any }>(`/collection-items/${itemId}`, {
      method: "DELETE",
    });
  }

  // ===== Local Guide: Discovery =====

  async getDiscoveryJobs(params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{
      data: any[];
      meta: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean };
    }>(`/discovery-jobs?${searchParams}`);
  }

  async startDiscovery(cityId: string, data: { categorySlug?: string; searchQuery?: string }) {
    return this.request<{ data: any }>(`/cities/${cityId}/discover`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
