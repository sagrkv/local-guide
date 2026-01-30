/**
 * Tags API Tests
 *
 * Tests tag CRUD operations and lead assignment
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { apiRequest, getAdminToken, testData, deleteTag } from '../setup';

describe('Tags API', () => {
  let adminToken: string;
  let createdTagId: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  afterAll(async () => {
    if (createdTagId) {
      await deleteTag(createdTagId, adminToken);
    }
  });

  describe('GET /tags', () => {
    it('should list all tags', async () => {
      const { status, data } = await apiRequest('/tags', {
        token: adminToken,
      });

      expect(status).toBe(200);
      expect(data).toBeInstanceOf(Array);

      // Check tag structure
      if ((data as any[]).length > 0) {
        const tag = (data as any[])[0];
        expect(tag.id).toBeDefined();
        expect(tag.name).toBeDefined();
        expect(tag.color).toBeDefined();
        expect(tag._count).toBeDefined();
      }
    });

    it('should return seeded tags', async () => {
      const { status, data } = await apiRequest('/tags', {
        token: adminToken,
      });

      expect(status).toBe(200);
      const tagNames = (data as any[]).map((t) => t.name);
      expect(tagNames).toContain('Hot Lead');
      expect(tagNames).toContain('Follow Up');
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/tags');

      expect(status).toBe(401);
    });
  });

  describe('POST /tags', () => {
    it('should create a tag with valid data', async () => {
      const tagData = {
        name: `API Test Tag ${Date.now()}`,
        color: '#3b82f6',
      };

      const { status, data } = await apiRequest('/tags', {
        method: 'POST',
        token: adminToken,
        body: tagData,
      });

      expect(status).toBe(201);
      expect((data as any).id).toBeDefined();
      expect((data as any).name).toBe(tagData.name);
      expect((data as any).color).toBe(tagData.color);

      createdTagId = (data as any).id;
    });

    it('should reject tag without name', async () => {
      const { status } = await apiRequest('/tags', {
        method: 'POST',
        token: adminToken,
        body: { color: '#ff0000' },
      });

      expect(status).toBe(400);
    });

    it('should reject tag without color', async () => {
      const { status } = await apiRequest('/tags', {
        method: 'POST',
        token: adminToken,
        body: { name: 'Test Tag' },
      });

      expect(status).toBe(400);
    });

    it('should reject invalid color format', async () => {
      const { status } = await apiRequest('/tags', {
        method: 'POST',
        token: adminToken,
        body: { name: 'Test Tag', color: 'not-a-color' },
      });

      expect(status).toBe(400);
    });

    it('should reject duplicate tag name', async () => {
      const { status } = await apiRequest('/tags', {
        method: 'POST',
        token: adminToken,
        body: { name: 'Hot Lead', color: '#ff0000' },
      });

      expect(status).toBe(400);
    });

    it('should reject empty tag name', async () => {
      const { status } = await apiRequest('/tags', {
        method: 'POST',
        token: adminToken,
        body: { name: '', color: '#ff0000' },
      });

      expect(status).toBe(400);
    });

    it('should reject tag name that is too long', async () => {
      const { status } = await apiRequest('/tags', {
        method: 'POST',
        token: adminToken,
        body: { name: 'a'.repeat(101), color: '#ff0000' },
      });

      expect(status).toBe(400);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/tags', {
        method: 'POST',
        body: testData.validTag,
      });

      expect(status).toBe(401);
    });
  });

  describe('PATCH /tags/:id', () => {
    it('should update tag name', async () => {
      if (!createdTagId) {
        console.log('Skipping: No tag created');
        return;
      }

      const newName = `Updated Tag ${Date.now()}`;
      const { status, data } = await apiRequest(`/tags/${createdTagId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { name: newName },
      });

      expect(status).toBe(200);
      expect((data as any).name).toBe(newName);
    });

    it('should update tag color', async () => {
      if (!createdTagId) {
        console.log('Skipping: No tag created');
        return;
      }

      const newColor = '#22c55e';
      const { status, data } = await apiRequest(`/tags/${createdTagId}`, {
        method: 'PATCH',
        token: adminToken,
        body: { color: newColor },
      });

      expect(status).toBe(200);
      expect((data as any).color).toBe(newColor);
    });

    it('should return 404 for non-existent tag', async () => {
      const { status } = await apiRequest('/tags/non-existent-id', {
        method: 'PATCH',
        token: adminToken,
        body: { name: 'Test' },
      });

      expect(status).toBe(404);
    });
  });

  describe('DELETE /tags/:id', () => {
    it('should return 404 for non-existent tag', async () => {
      const { status } = await apiRequest('/tags/non-existent-id', {
        method: 'DELETE',
        token: adminToken,
      });

      expect(status).toBe(404);
    });

    it('should reject unauthenticated request', async () => {
      const { status } = await apiRequest('/tags/any-id', {
        method: 'DELETE',
      });

      expect(status).toBe(401);
    });
  });
});
