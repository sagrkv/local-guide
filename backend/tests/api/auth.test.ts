/**
 * Auth API Tests
 *
 * Tests authentication endpoints including login, session management, and user info
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { apiRequest, getAdminToken, login, BASE_URL } from '../setup';

describe('Auth API', () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const result = await login('admin@boko.app', 'admin123');

      expect(result.token).toBeDefined();
      expect(result.token).toMatch(/^eyJ/); // JWT format
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('admin@boko.app');
      expect(result.user.role).toBe('ADMIN');
    });

    it('should reject invalid email', async () => {
      const { status, data } = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: 'nonexistent@email.com', password: 'password123' },
      });

      expect(status).toBe(401);
      expect((data as any).error).toMatch(/invalid/i);
    });

    it('should reject invalid password', async () => {
      const { status, data } = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: 'admin@boko.app', password: 'wrongpassword' },
      });

      expect(status).toBe(401);
      expect((data as any).error).toMatch(/invalid/i);
    });

    it('should reject missing email', async () => {
      const { status } = await apiRequest('/auth/login', {
        method: 'POST',
        body: { password: 'password123' },
      });

      expect(status).toBe(400);
    });

    it('should reject missing password', async () => {
      const { status } = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: 'admin@boko.app' },
      });

      expect(status).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const { status } = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: 'not-an-email', password: 'password123' },
      });

      expect(status).toBe(400);
    });

    it('should reject short password', async () => {
      const { status } = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email: 'admin@boko.app', password: '123' },
      });

      expect(status).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user with valid token', async () => {
      const { status, data } = await apiRequest('/auth/me', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).user).toBeDefined();
      expect((data as any).user.email).toBe('admin@boko.app');
      expect((data as any).user.id).toBeDefined();
      expect((data as any).user.role).toBe('ADMIN');
      expect((data as any).user.isActive).toBe(true);
    });

    it('should reject request without token', async () => {
      const { status, data } = await apiRequest('/auth/me');

      expect(status).toBe(401);
      expect((data as any).error).toMatch(/no authorization token/i);
    });

    it('should reject invalid token', async () => {
      const { status, data } = await apiRequest('/auth/me', {
        token: 'invalid-token',
      });

      expect(status).toBe(401);
      expect((data as any).error).toMatch(/invalid|expired/i);
    });

    it('should reject malformed JWT', async () => {
      const { status } = await apiRequest('/auth/me', {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      });

      expect(status).toBe(401);
    });
  });

  describe('POST /auth/change-password', () => {
    it('should reject change without authentication', async () => {
      const { status } = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: 'admin123', newPassword: 'newpassword123' },
      });

      expect(status).toBe(401);
    });

    it('should reject with wrong current password', async () => {
      const { status, data } = await apiRequest('/auth/change-password', {
        method: 'POST',
        token: adminToken,
        body: { currentPassword: 'wrongpassword', newPassword: 'newpassword123' },
      });

      expect(status).toBe(400);
      expect((data as any).error).toMatch(/incorrect/i);
    });

    it('should reject short new password', async () => {
      const { status } = await apiRequest('/auth/change-password', {
        method: 'POST',
        token: adminToken,
        body: { currentPassword: 'admin123', newPassword: '123' },
      });

      expect(status).toBe(400);
    });
  });
});
