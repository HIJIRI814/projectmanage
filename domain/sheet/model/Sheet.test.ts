import { describe, it, expect } from 'vitest';
import { Sheet } from './Sheet';

describe('Sheet', () => {
  describe('create', () => {
    it('should create a new sheet with all fields', () => {
      const id = 'sheet-id';
      const projectId = 'project-id';
      const name = 'Sheet Name';
      const description = 'Sheet Description';
      const content = 'Sheet Content';
      const imageUrl = 'https://example.com/image.png';

      const sheet = Sheet.create(id, projectId, name, description, content, imageUrl);

      expect(sheet.id).toBe(id);
      expect(sheet.projectId).toBe(projectId);
      expect(sheet.name).toBe(name);
      expect(sheet.description).toBe(description);
      expect(sheet.content).toBe(content);
      expect(sheet.imageUrl).toBe(imageUrl);
      expect(sheet.createdAt).toBeInstanceOf(Date);
      expect(sheet.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a sheet with optional fields as null', () => {
      const id = 'sheet-id';
      const projectId = 'project-id';
      const name = 'Sheet Name';

      const sheet = Sheet.create(id, projectId, name);

      expect(sheet.id).toBe(id);
      expect(sheet.projectId).toBe(projectId);
      expect(sheet.name).toBe(name);
      expect(sheet.description).toBeNull();
      expect(sheet.content).toBeNull();
      expect(sheet.imageUrl).toBeNull();
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct a sheet from existing data', () => {
      const id = 'sheet-id';
      const projectId = 'project-id';
      const name = 'Sheet Name';
      const description = 'Sheet Description';
      const content = 'Sheet Content';
      const imageUrl = 'https://example.com/image.png';
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const sheet = Sheet.reconstruct(
        id,
        projectId,
        name,
        description,
        content,
        imageUrl,
        createdAt,
        updatedAt
      );

      expect(sheet.id).toBe(id);
      expect(sheet.projectId).toBe(projectId);
      expect(sheet.name).toBe(name);
      expect(sheet.description).toBe(description);
      expect(sheet.content).toBe(content);
      expect(sheet.imageUrl).toBe(imageUrl);
      expect(sheet.createdAt).toEqual(createdAt);
      expect(sheet.updatedAt).toEqual(updatedAt);
    });

    it('should reconstruct a sheet with null optional fields', () => {
      const id = 'sheet-id';
      const projectId = 'project-id';
      const name = 'Sheet Name';
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const sheet = Sheet.reconstruct(
        id,
        projectId,
        name,
        null,
        null,
        null,
        createdAt,
        updatedAt
      );

      expect(sheet.id).toBe(id);
      expect(sheet.projectId).toBe(projectId);
      expect(sheet.name).toBe(name);
      expect(sheet.description).toBeNull();
      expect(sheet.content).toBeNull();
      expect(sheet.imageUrl).toBeNull();
    });
  });
});

