const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('token', data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Leads
  async getLeads(params?: {
    page?: number;
    limit?: number;
    stage?: string;
    category?: string;
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
    return this.request<{ data: any[]; pagination: any }>(`/leads?${searchParams}`);
  }

  async getLead(id: string) {
    return this.request<any>(`/leads/${id}`);
  }

  async createLead(data: any) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLead(id: string, data: any) {
    return this.request(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLead(id: string) {
    return this.request(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  async changeLeadStage(id: string, stage: string, notes?: string) {
    return this.request(`/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, notes }),
    });
  }

  async assignLead(id: string, userId: string | null) {
    return this.request(`/leads/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Activities
  async getActivities(params?: { leadId?: string; page?: number; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{ data: any[]; pagination: any }>(`/activities?${searchParams}`);
  }

  async createActivity(data: any) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeActivity(id: string, outcome?: string) {
    return this.request(`/activities/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ outcome }),
    });
  }

  // Tags
  async getTags() {
    return this.request<any[]>('/tags');
  }

  async createTag(data: { name: string; color?: string }) {
    return this.request('/tags', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteTag(id: string) {
    return this.request(`/tags/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request<any>('/dashboard/stats');
  }

  async getPipelineCounts() {
    return this.request<any[]>('/dashboard/pipeline');
  }

  async getLeadsByCategory() {
    return this.request<any[]>('/dashboard/by-category');
  }

  async getRecentActivities() {
    return this.request<any[]>('/dashboard/recent-activities');
  }

  async getLeadsOverTime() {
    return this.request<any[]>('/dashboard/leads-over-time');
  }

  async getConversionRates() {
    return this.request<any>('/dashboard/conversion-rates');
  }

  // Scraping
  async getScrapeJobs(params?: { page?: number; limit?: number; status?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    return this.request<{ data: any[]; pagination: any }>(`/scraping/jobs?${searchParams}`);
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
    return this.request('/scraping/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelScrapeJob(id: string) {
    return this.request(`/scraping/jobs/${id}/cancel`, {
      method: 'POST',
    });
  }

  async getScrapingStats() {
    return this.request<any>('/scraping/stats');
  }

  // Regions
  async getRegions() {
    return this.request<any[]>('/regions');
  }

  async createRegion(data: { name: string; cities: string[]; state?: string }) {
    return this.request('/regions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRegion(id: string, data: any) {
    return this.request(`/regions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRegion(id: string) {
    return this.request(`/regions/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleRegion(id: string) {
    return this.request(`/regions/${id}/toggle`, {
      method: 'POST',
    });
  }
}

export const apiClient = new ApiClient();
