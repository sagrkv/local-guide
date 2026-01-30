/**
 * Admin API Tests
 *
 * Tests admin-only endpoints for user management, analytics, and system administration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiRequest, adminApiRequest, getAdminToken, login, ADMIN_PREFIX } from '../setup';

describe('Admin API', () => {
  let adminToken: string;
  let createdCouponId: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  afterAll(async () => {
    // Cleanup created coupon
    if (createdCouponId) {
      await apiRequest(`/admin/coupons/${createdCouponId}`, {
        method: 'DELETE',
        token: adminToken,
      });
    }
  });

  describe('User Management', () => {
    describe('GET /{adminPrefix}/users', () => {
      it('should list all users', async () => {
        const { status, data } = await adminApiRequest('/users', {
          token: adminToken,
        });

        expect(status).toBe(200);
        expect((data as any).users).toBeInstanceOf(Array);
        expect((data as any).pagination).toBeDefined();
        expect((data as any).users.length).toBeGreaterThan(0);
      });

      it('should support pagination', async () => {
        const { status, data } = await adminApiRequest('/users?page=1&limit=10', {
          token: adminToken,
        });

        expect(status).toBe(200);
        expect((data as any).pagination.page).toBe(1);
        expect((data as any).pagination.limit).toBe(10);
      });

      it('should support search', async () => {
        const { status, data } = await adminApiRequest('/users?search=admin', {
          token: adminToken,
        });

        expect(status).toBe(200);
        expect((data as any).users).toBeInstanceOf(Array);
      });

      it('should reject unauthenticated request', async () => {
        const { status } = await apiRequest(`/${ADMIN_PREFIX}/users`);

        expect(status).toBe(401);
      });
    });

    describe('GET /{adminPrefix}/users/:id', () => {
      it('should return specific user details', async () => {
        // First get a user ID
        const { data: listData } = await adminApiRequest('/users', {
          token: adminToken,
        });

        const userId = (listData as any).users[0].id;

        const { status, data } = await adminApiRequest(`/users/${userId}`, {
          token: adminToken,
        });

        expect(status).toBe(200);
        expect((data as any).id).toBe(userId);
        expect((data as any).email).toBeDefined();
      });

      it('should return 404 for non-existent user', async () => {
        const { status } = await adminApiRequest('/users/non-existent-id', {
          token: adminToken,
        });

        expect(status).toBe(404);
      });
    });
  });

  describe('Analytics', () => {
    describe('GET /{adminPrefix}/analytics/overview', () => {
      it('should return analytics overview', async () => {
        const { status, data } = await adminApiRequest('/analytics/overview', {
          token: adminToken,
        });

        expect(status).toBe(200);
        expect((data as any).totalUsers).toBeDefined();
        expect((data as any).totalLeads).toBeDefined();
        expect((data as any).activeUsers).toBeDefined();
      });

      it('should reject unauthenticated request', async () => {
        const { status } = await apiRequest(`/${ADMIN_PREFIX}/analytics/overview`);

        expect(status).toBe(401);
      });
    });
  });

  describe('Audit Logs', () => {
    describe('GET /{adminPrefix}/audit-logs', () => {
      it('should return audit logs', async () => {
        const { status, data } = await adminApiRequest('/audit-logs', {
          token: adminToken,
        });

        expect(status).toBe(200);
        expect((data as any).data).toBeInstanceOf(Array);
        expect((data as any).pagination).toBeDefined();
      });

      it('should support pagination', async () => {
        const { status, data } = await adminApiRequest('/audit-logs?page=1&limit=10', {
          token: adminToken,
        });

        expect(status).toBe(200);
        expect((data as any).pagination.page).toBe(1);
        expect((data as any).pagination.limit).toBe(10);
      });

      it('should support filtering by action', async () => {
        const { status, data } = await adminApiRequest('/audit-logs?action=LOGIN_SUCCESS', {
          token: adminToken,
        });

        expect(status).toBe(200);
        expect((data as any).data).toBeInstanceOf(Array);

        // All returned logs should have the filtered action
        (data as any).data.forEach((log: any) => {
          expect(log.action).toBe('LOGIN_SUCCESS');
        });
      });

      it('should reject unauthenticated request', async () => {
        const { status } = await apiRequest(`/${ADMIN_PREFIX}/audit-logs`);

        expect(status).toBe(401);
      });
    });
  });

  describe('Coupons', () => {
    describe('GET /admin/coupons', () => {
      it('should list all coupons', async () => {
        const { status, data } = await apiRequest('/admin/coupons', {
          token: adminToken,
        });

        expect(status).toBe(200);
        expect(data).toBeInstanceOf(Array);
      });

      it('should reject unauthenticated request', async () => {
        const { status } = await apiRequest('/admin/coupons');

        expect(status).toBe(401);
      });
    });

    describe('POST /admin/coupons', () => {
      it('should create a coupon with valid data', async () => {
        const couponData = {
          code: `TESTCOUPON${Date.now()}`,
          creditAmount: 50,
          maxUses: 10,
        };

        const { status, data } = await apiRequest('/admin/coupons', {
          method: 'POST',
          token: adminToken,
          body: couponData,
        });

        expect(status).toBe(201);
        expect((data as any).id).toBeDefined();
        expect((data as any).code).toBe(couponData.code);
        expect((data as any).creditAmount).toBe(couponData.creditAmount);
        expect((data as any).maxUses).toBe(couponData.maxUses);

        createdCouponId = (data as any).id;
      });

      it('should reject coupon without code', async () => {
        const { status } = await apiRequest('/admin/coupons', {
          method: 'POST',
          token: adminToken,
          body: { creditAmount: 50 },
        });

        expect(status).toBe(400);
      });

      it('should reject coupon without creditAmount', async () => {
        const { status } = await apiRequest('/admin/coupons', {
          method: 'POST',
          token: adminToken,
          body: { code: 'TESTCODE' },
        });

        expect(status).toBe(400);
      });

      it('should reject coupon with invalid code format', async () => {
        const { status } = await apiRequest('/admin/coupons', {
          method: 'POST',
          token: adminToken,
          body: { code: 'invalid code!@#', creditAmount: 50 },
        });

        expect(status).toBe(400);
      });

      it('should reject coupon with negative creditAmount', async () => {
        const { status } = await apiRequest('/admin/coupons', {
          method: 'POST',
          token: adminToken,
          body: { code: 'TESTCODE', creditAmount: -50 },
        });

        expect(status).toBe(400);
      });

      it('should reject coupon with zero creditAmount', async () => {
        const { status } = await apiRequest('/admin/coupons', {
          method: 'POST',
          token: adminToken,
          body: { code: 'TESTCODE', creditAmount: 0 },
        });

        expect(status).toBe(400);
      });

      it('should reject duplicate coupon code', async () => {
        if (!createdCouponId) {
          console.log('Skipping: No coupon created');
          return;
        }

        // Get the created coupon's code
        const { data: coupons } = await apiRequest('/admin/coupons', {
          token: adminToken,
        });

        const existingCode = (coupons as any[]).find((c) => c.id === createdCouponId)?.code;

        if (existingCode) {
          const { status } = await apiRequest('/admin/coupons', {
            method: 'POST',
            token: adminToken,
            body: { code: existingCode, creditAmount: 100 },
          });

          expect(status).toBe(400);
        }
      });

      it('should reject unauthenticated request', async () => {
        const { status } = await apiRequest('/admin/coupons', {
          method: 'POST',
          body: { code: 'TEST', creditAmount: 50 },
        });

        expect(status).toBe(401);
      });
    });

    describe('DELETE /admin/coupons/:id', () => {
      it('should return 404 for non-existent coupon', async () => {
        const { status } = await apiRequest('/admin/coupons/non-existent-id', {
          method: 'DELETE',
          token: adminToken,
        });

        expect(status).toBe(404);
      });
    });
  });

  describe('Credit Management', () => {
    describe('POST /{adminPrefix}/users/:id/credits', () => {
      it('should add credits to user', async () => {
        // Get a user ID first
        const { data: listData } = await adminApiRequest('/users', {
          token: adminToken,
        });

        const userId = (listData as any).users[0].id;
        const creditsToAdd = 10;

        const { status, data } = await adminApiRequest(`/users/${userId}/credits`, {
          method: 'POST',
          token: adminToken,
          body: { amount: creditsToAdd, description: 'Test credit addition' },
        });

        expect(status).toBe(200);
        expect((data as any).newBalance).toBeDefined();
      });

      it('should reject negative credit amount', async () => {
        const { data: listData } = await adminApiRequest('/users', {
          token: adminToken,
        });

        const userId = (listData as any).users[0].id;

        const { status } = await adminApiRequest(`/users/${userId}/credits`, {
          method: 'POST',
          token: adminToken,
          body: { amount: -50, description: 'Invalid' },
        });

        expect(status).toBe(400);
      });

      it('should return 404 for non-existent user', async () => {
        const { status } = await adminApiRequest('/users/non-existent-id/credits', {
          method: 'POST',
          token: adminToken,
          body: { amount: 50, description: 'Test' },
        });

        expect(status).toBe(404);
      });
    });
  });
});
