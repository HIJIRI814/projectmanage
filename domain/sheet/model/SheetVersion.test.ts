import { describe, it, expect } from 'vitest';
import { SheetVersion } from './SheetVersion';

describe('SheetVersion', () => {
  const versionId = 'test-version-id';
  const sheetId = 'test-sheet-id';
  const name = 'Test Sheet';
  const description = 'Test Description';
  const content = 'This is the content of the test sheet.';

  describe('create', () => {
    it('should create a new SheetVersion', () => {
      const version = SheetVersion.create(versionId, sheetId, name, description, content);

      expect(version).toBeInstanceOf(SheetVersion);
      expect(version.id).toBe(versionId);
      expect(version.sheetId).toBe(sheetId);
      expect(version.name).toBe(name);
      expect(version.description).toBe(description);
      expect(version.content).toBe(content);
      expect(version.versionName).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(version.createdAt).toBeInstanceOf(Date);
    });

    it('should create a SheetVersion with null description and content when not provided', () => {
      const version = SheetVersion.create(versionId, sheetId, name, null, null);

      expect(version).toBeInstanceOf(SheetVersion);
      expect(version.id).toBe(versionId);
      expect(version.sheetId).toBe(sheetId);
      expect(version.name).toBe(name);
      expect(version.description).toBeNull();
      expect(version.content).toBeNull();
      expect(version.versionName).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(version.createdAt).toBeInstanceOf(Date);
    });

    it('should generate version name in YYYY-MM-DD HH:mm:ss format', () => {
      const now = new Date('2024-12-14T10:30:45');
      const version = SheetVersion.create(versionId, sheetId, name, description, content);

      // バージョン名の形式を確認
      expect(version.versionName).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct a SheetVersion from existing data', () => {
      const createdAt = new Date('2024-01-01');
      const versionName = '2024-01-01 12:00:00';

      const version = SheetVersion.reconstruct(
        versionId,
        sheetId,
        name,
        description,
        content,
        versionName,
        createdAt
      );

      expect(version).toBeInstanceOf(SheetVersion);
      expect(version.id).toBe(versionId);
      expect(version.sheetId).toBe(sheetId);
      expect(version.name).toBe(name);
      expect(version.description).toBe(description);
      expect(version.content).toBe(content);
      expect(version.versionName).toBe(versionName);
      expect(version.createdAt).toEqual(createdAt);
    });

    it('should reconstruct a SheetVersion with null description and content', () => {
      const createdAt = new Date('2024-01-01');
      const versionName = '2024-01-01 12:00:00';

      const version = SheetVersion.reconstruct(
        versionId,
        sheetId,
        name,
        null,
        null,
        versionName,
        createdAt
      );

      expect(version).toBeInstanceOf(SheetVersion);
      expect(version.id).toBe(versionId);
      expect(version.sheetId).toBe(sheetId);
      expect(version.name).toBe(name);
      expect(version.description).toBeNull();
      expect(version.content).toBeNull();
      expect(version.versionName).toBe(versionName);
      expect(version.createdAt).toEqual(createdAt);
    });
  });
});

