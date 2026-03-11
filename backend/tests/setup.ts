/**
 * Test Setup and Utilities
 *
 * Provides authentication helpers and common test utilities
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const ADMIN_PREFIX = process.env.ADMIN_URL_PREFIX || 'nucleus-admin-x7k9m2';

interface AuthToken {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

let cachedAdminToken: AuthToken | null = null;
let cachedUserToken: AuthToken | null = null;

/**
 * Login and get JWT token
 */
export async function login(email: string, password: string): Promise<AuthToken> {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

/**
 * Get admin token (cached)
 */
export async function getAdminToken(): Promise<string> {
  if (!cachedAdminToken) {
    cachedAdminToken = await login('admin@localguide.in', 'admin123');
  }
  return cachedAdminToken.token;
}

/**
 * Get admin user info
 */
export async function getAdminUser(): Promise<AuthToken['user']> {
  if (!cachedAdminToken) {
    cachedAdminToken = await login('admin@localguide.in', 'admin123');
  }
  return cachedAdminToken.user;
}

/**
 * Make authenticated API request
 */
export async function apiRequest(
  endpoint: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    expectStatus?: number;
  } = {}
): Promise<{ status: number; data: unknown; ok: boolean }> {
  const { method = 'GET', body, token, expectStatus } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (expectStatus !== undefined && response.status !== expectStatus) {
    throw new Error(
      `Expected status ${expectStatus}, got ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return {
    status: response.status,
    data,
    ok: response.ok,
  };
}

/**
 * Make admin API request (uses admin prefix)
 */
export async function adminApiRequest(
  endpoint: string,
  options: Parameters<typeof apiRequest>[1] = {}
): Promise<ReturnType<typeof apiRequest>> {
  const token = options.token || await getAdminToken();
  return apiRequest(`/${ADMIN_PREFIX}${endpoint}`, { ...options, token });
}

/**
 * Test data generators
 */
export const testData = {
  validLead: {
    businessName: 'Test Business',
    phone: '+919876543210',
    email: 'test@business.com',
    website: 'https://testbusiness.com',
    address: '123 Test Street',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
  },

  validTag: {
    name: `Test Tag ${Date.now()}`,
    color: '#ff0000',
  },

  validSavedRegion: {
    name: `Test Region ${Date.now()}`,
    southwestLat: 12.9,
    southwestLng: 77.5,
    northeastLat: 13.0,
    northeastLng: 77.7,
  },

  validScrapingRegion: {
    name: `Scraping Region ${Date.now()}`,
    cities: ['Test City 1', 'Test City 2'],
    state: 'Test State',
    country: 'India',
    isActive: true,
  },

  validActivity: (leadId: string) => ({
    leadId,
    type: 'NOTE',
    description: 'Test note content',
  }),

  validCoupon: {
    code: `TEST${Date.now()}`,
    creditAmount: 50,
    maxUses: 10,
  },
};

/**
 * Cleanup helpers
 */
export async function deleteTag(id: string, token: string): Promise<void> {
  await apiRequest(`/tags/${id}`, { method: 'DELETE', token });
}

export async function deleteSavedRegion(id: string, token: string): Promise<void> {
  await apiRequest(`/saved-regions/${id}`, { method: 'DELETE', token });
}

export async function deleteScrapingRegion(id: string, token: string): Promise<void> {
  await apiRequest(`/regions/${id}`, { method: 'DELETE', token });
}

export { BASE_URL, ADMIN_PREFIX };
