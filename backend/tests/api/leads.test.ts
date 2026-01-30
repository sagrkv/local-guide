/**
 * Leads API Tests
 *
 * Tests lead CRUD operations, filtering, pagination, and stage management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiRequest, getAdminToken, testData } from '../setup';

describe('Leads API', () => {
  let adminToken: string;
  let createdLeadId: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  afterAll(async () => {
    // Cleanup created lead
    if (createdLeadId) {
      await apiRequest(`/leads/${createdLeadId}`, {
        method: 'DELETE',
        token: adminToken,
      });
    }
  });

  describe('GET /leads', () => {
    it('should list leads with pagination', async () => {
      const { status, data } = await apiRequest('/leads', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).data).toBeInstanceOf(Array);
      expect((data as any).pagination).toBeDefined();
      expect((data as any).pagination.page).toBe(1);
      expect((data as any).pagination.limit).toBeGreaterThan(0);
      expect((data as any).pagination.total).toBeGreaterThanOrEqual(0);
    });

    it('should respect limit parameter', async () => {
      const { status, data } = await apiRequest('/leads?limit=5', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).pagination.limit).toBe(5);
    });

    it('should respect offset parameter', async () => {
      const { status, data } = await apiRequest('/leads?offset=10', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).pagination).toBeDefined();
    });

    it('should filter by stage', async () => {
      const { status, data } = await apiRequest('/leads?stage=NEW', {
        token: adminToken,
      });

      expect(status).toBe(200);
      // All returned leads should have stage NEW
      (data as any).data.forEach((lead: any) => {
        expect(lead.stage).toBe('NEW');
      });
    });

    it('should filter by multiple stages', async () => {
      const { status, data } = await apiRequest('/leads?stage=NEW&stage=CONTACTED', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).data).toBeInstanceOf(Array);
    });

    it('should search by query', async () => {
      const { status, data } = await apiRequest('/leads?search=test', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).data).toBeInstanceOf(Array);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/leads');

      expect(status).toBe(401);
    });

    it('should support sorting', async () => {
      const { status, data } = await apiRequest('/leads?sortBy=createdAt&sortOrder=desc', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).data).toBeInstanceOf(Array);
    });
  });

  describe('POST /leads', () => {
    it('should create a lead with valid data', async () => {
      const leadData = {
        ...testData.validLead,
        businessName: `Test Business ${Date.now()}`,
      };

      const { status, data } = await apiRequest('/leads', {
        method: 'POST',
        token: adminToken,
        body: leadData,
      });

      expect(status).toBe(201);
      expect((data as any).id).toBeDefined();
      expect((data as any).businessName).toBe(leadData.businessName);
      expect((data as any).stage).toBe('NEW');

      createdLeadId = (data as any).id;
    });

    it('should reject lead without businessName', async () => {
      const { businessName, ...leadWithoutName } = testData.validLead;

      const { status } = await apiRequest('/leads', {
        method: 'POST',
        token: adminToken,
        body: leadWithoutName,
      });

      expect(status).toBe(400);
    });

    it('should reject invalid email format', async () => {
      const { status } = await apiRequest('/leads', {
        method: 'POST',
        token: adminToken,
        body: { ...testData.validLead, email: 'not-an-email' },
      });

      expect(status).toBe(400);
    });

    it('should reject invalid website URL', async () => {
      const { status } = await apiRequest('/leads', {
        method: 'POST',
        token: adminToken,
        body: { ...testData.validLead, website: 'not-a-url' },
      });

      expect(status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/leads', {
        method: 'POST',
        body: testData.validLead,
      });

      expect(status).toBe(401);
    });
  });

  describe('GET /leads/:id', () => {
    it('should return a specific lead', async () => {
      if (!createdLeadId) {
        console.log('Skipping: No lead created');
        return;
      }

      const { status, data } = await apiRequest(`/leads/${createdLeadId}`, {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect((data as any).id).toBe(createdLeadId);
    });

    it('should return 404 for non-existent lead', async () => {
      const { status } = await apiRequest('/leads/non-existent-id', {
        token: adminToken,
      });

      expect(status).toBe(404);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest(`/leads/${createdLeadId || 'any'}`);

      expect(status).toBe(401);
    });
  });

  describe('PATCH /leads/:id', () => {
    it('should update lead stage', async () => {
      if (!createdLeadId) {
        console.log('Skipping: No lead created');
        return;
      }

      const { status, data } = await apiRequest(`/leads/${createdLeadId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { stage: 'CONTACTED' },
      });

      expect(status).toBe(200);
      expect((data as any).stage).toBe('CONTACTED');
    });

    it('should update multiple fields', async () => {
      if (!createdLeadId) {
        console.log('Skipping: No lead created');
        return;
      }

      const { status, data } = await apiRequest(`/leads/${createdLeadId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { phone: '+911234567890', city: 'Chennai' },
      });

      expect(status).toBe(200);
      expect((data as any).phone).toBe('+911234567890');
      expect((data as any).city).toBe('Chennai');
    });

    it('should reject invalid stage value', async () => {
      if (!createdLeadId) {
        console.log('Skipping: No lead created');
        return;
      }

      const { status } = await apiRequest(`/leads/${createdLeadId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { stage: 'INVALID_STAGE' },
      });

      expect(status).toBe(400);
    });

    it('should return 404 for non-existent lead', async () => {
      const { status } = await apiRequest('/leads/non-existent-id', {
        method: 'PATCH',
        token: adminToken,
        body: { stage: 'CONTACTED' },
      });

      expect(status).toBe(404);
    });
  });

  describe('DELETE /leads/:id', () => {
    it('should return 404 for non-existent lead', async () => {
      const { status } = await apiRequest('/leads/non-existent-id', {
        method: 'DELETE',
        token: adminToken,
      });

      expect(status).toBe(404);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/leads/any-id', {
        method: 'DELETE',
      });

      expect(status).toBe(401);
    });
  });
});
