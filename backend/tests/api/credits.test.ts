/**
 * Credits API Tests
 *
 * Tests credit balance, history, and coupon redemption
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { apiRequest, getAdminToken } from '../setup';

describe('Credits API', () => {
  let adminToken: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  describe('GET /credits/balance', () => {
    it('should return credit balance', async () => {
      const { status, data } = await apiRequest('/credits/balance', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).balance).toBeDefined();
      expect(typeof (data as any).balance).toBe('number');
      expect((data as any).balance).toBeGreaterThanOrEqual(0);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/credits/balance');

      expect(status).toBe(401);
    });
  });

  describe('GET /credits/history', () => {
    it('should return credit transaction history', async () => {
      const { status, data } = await apiRequest('/credits/history', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).transactions).toBeInstanceOf(Array);
      expect((data as any).total).toBeGreaterThanOrEqual(0);
      expect((data as any).limit).toBeDefined();
      expect((data as any).offset).toBeDefined();
    });

    it('should support pagination', async () => {
      const { status, data } = await apiRequest('/credits/history?limit=10&offset=0', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).limit).toBe(10);
      expect((data as any).offset).toBe(0);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/credits/history');

      expect(status).toBe(401);
    });
  });

  describe('POST /coupons/redeem', () => {
    it('should reject redemption with invalid coupon code', async () => {
      const { status, data } = await apiRequest('/coupons/redeem', {
        method: 'POST',
        token: adminToken,
        body: { code: 'INVALID-COUPON-CODE' },
      });

      expect(status).toBe(404);
      expect((data as any).error).toMatch(/not found|invalid/i);
    });

    it('should reject redemption without code', async () => {
      const { status } = await apiRequest('/coupons/redeem', {
        method: 'POST',
        token: adminToken,
        body: {},
      });

      expect(status).toBe(400);
    });

    it('should reject redemption with empty code', async () => {
      const { status } = await apiRequest('/coupons/redeem', {
        method: 'POST',
        token: adminToken,
        body: { code: '' },
      });

      expect(status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/coupons/redeem', {
        method: 'POST',
        body: { code: 'TEST123' },
      });

      expect(status).toBe(401);
    });
  });
});
