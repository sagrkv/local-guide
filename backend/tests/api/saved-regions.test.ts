/**
 * Saved Regions API Tests
 *
 * Tests user-saved map bounds for scraping regions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiRequest, getAdminToken, testData, deleteSavedRegion } from '../setup';

describe('Saved Regions API', () => {
  let adminToken: string;
  let createdRegionId: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  afterAll(async () => {
    if (createdRegionId) {
      await deleteSavedRegion(createdRegionId, adminToken);
    }
  });

  describe('GET /saved-regions', () => {
    it('should list saved regions with pagination', async () => {
      const { status, data } = await apiRequest('/saved-regions', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).regions).toBeInstanceOf(Array);
      expect((data as any).total).toBeGreaterThanOrEqual(0);
    });

    it('should support limit and offset', async () => {
      const { status, data } = await apiRequest('/saved-regions?limit=5&offset=0', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).limit).toBe(5);
      expect((data as any).offset).toBe(0);
    });

    it('should support sorting', async () => {
      const { status, data } = await apiRequest('/saved-regions?sortBy=lastUsed&sortOrder=desc', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).regions).toBeInstanceOf(Array);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/saved-regions');

      expect(status).toBe(401);
    });
  });

  describe('GET /saved-regions/recent', () => {
    it('should return recently used regions', async () => {
      const { status, data } = await apiRequest('/saved-regions/recent', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).regions).toBeInstanceOf(Array);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/saved-regions/recent');

      expect(status).toBe(401);
    });
  });

  describe('POST /saved-regions', () => {
    it('should create a saved region with valid data', async () => {
      const regionData = {
        name: `Test Region ${Date.now()}`,
        southwestLat: 12.9,
        southwestLng: 77.5,
        northeastLat: 13.0,
        northeastLng: 77.7,
      };

      const { status, data } = await apiRequest('/saved-regions', {
        method: 'POST',
        token: adminToken,
        body: regionData,
      });

      expect(status).toBe(201);
      expect((data as any).id).toBeDefined();
      expect((data as any).name).toBe(regionData.name);
      expect((data as any).southwestLat).toBe(regionData.southwestLat);
      expect((data as any).northeastLng).toBe(regionData.northeastLng);

      createdRegionId = (data as any).id;
    });

    it('should reject region without name', async () => {
      const { status } = await apiRequest('/saved-regions', {
        method: 'POST',
        token: adminToken,
        body: {
          southwestLat: 12.9,
          southwestLng: 77.5,
          northeastLat: 13.0,
          northeastLng: 77.7,
        },
      });

      expect(status).toBe(400);
    });

    it('should reject region without coordinates', async () => {
      const { status } = await apiRequest('/saved-regions', {
        method: 'POST',
        token: adminToken,
        body: { name: 'Test Region' },
      });

      expect(status).toBe(400);
    });

    it('should reject invalid latitude (> 90)', async () => {
      const { status } = await apiRequest('/saved-regions', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Test Region',
          southwestLat: 91, // Invalid
          southwestLng: 77.5,
          northeastLat: 92, // Invalid
          northeastLng: 77.7,
        },
      });

      expect(status).toBe(400);
    });

    it('should reject invalid latitude (< -90)', async () => {
      const { status } = await apiRequest('/saved-regions', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Test Region',
          southwestLat: -91, // Invalid
          southwestLng: 77.5,
          northeastLat: -90,
          northeastLng: 77.7,
        },
      });

      expect(status).toBe(400);
    });

    it('should reject invalid longitude (> 180)', async () => {
      const { status } = await apiRequest('/saved-regions', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Test Region',
          southwestLat: 12.9,
          southwestLng: 181, // Invalid
          northeastLat: 13.0,
          northeastLng: 182, // Invalid
        },
      });

      expect(status).toBe(400);
    });

    it('should reject southwest lat greater than northeast lat', async () => {
      const { status } = await apiRequest('/saved-regions', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Test Region',
          southwestLat: 14.0, // Greater than northeast
          southwestLng: 77.5,
          northeastLat: 13.0,
          northeastLng: 77.7,
        },
      });

      expect(status).toBe(400);
    });

    it('should reject region that is too small', async () => {
      const { status } = await apiRequest('/saved-regions', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Tiny Region',
          southwestLat: 12.9,
          southwestLng: 77.5,
          northeastLat: 12.9001, // Too small (< 0.001)
          northeastLng: 77.5001,
        },
      });

      expect(status).toBe(400);
    });

    it('should reject region that is too large', async () => {
      const { status } = await apiRequest('/saved-regions', {
        method: 'POST',
        token: adminToken,
        body: {
          name: 'Huge Region',
          southwestLat: 0,
          southwestLng: 0,
          northeastLat: 20, // > 10 degrees
          northeastLng: 20,
        },
      });

      expect(status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/saved-regions', {
        method: 'POST',
        body: testData.validSavedRegion,
      });

      expect(status).toBe(401);
    });
  });

  describe('GET /saved-regions/:id', () => {
    it('should return a specific saved region', async () => {
      if (!createdRegionId) {
        console.log('Skipping: No region created');
        return;
      }

      const { status, data } = await apiRequest(`/saved-regions/${createdRegionId}`, {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).id).toBe(createdRegionId);
    });

    it('should return 404 for non-existent region', async () => {
      const { status } = await apiRequest('/saved-regions/non-existent-id', {
        token: adminToken,
      });

      expect(status).toBe(404);
    });
  });

  describe('PUT /saved-regions/:id', () => {
    it('should update region name', async () => {
      if (!createdRegionId) {
        console.log('Skipping: No region created');
        return;
      }

      const newName = `Updated Region ${Date.now()}`;
      const { status, data } = await apiRequest(`/saved-regions/${createdRegionId}`, {
        method: 'PUT',
        token: adminToken,
        body: { name: newName },
      });

      expect(status).toBe(200);
      expect((data as any).name).toBe(newName);
    });

    it('should return 404 for non-existent region', async () => {
      const { status } = await apiRequest('/saved-regions/non-existent-id', {
        method: 'PUT',
        token: adminToken,
        body: { name: 'Test' },
      });

      expect(status).toBe(404);
    });
  });

  describe('POST /saved-regions/:id/use', () => {
    it('should mark region as used', async () => {
      if (!createdRegionId) {
        console.log('Skipping: No region created');
        return;
      }

      const { status, data } = await apiRequest(`/saved-regions/${createdRegionId}/use`, {
        method: 'POST',
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).timesUsed).toBeGreaterThan(0);
    });
  });

  describe('DELETE /saved-regions/:id', () => {
    it('should return 404 for non-existent region', async () => {
      const { status } = await apiRequest('/saved-regions/non-existent-id', {
        method: 'DELETE',
        token: adminToken,
      });

      expect(status).toBe(404);
    });
  });
});
