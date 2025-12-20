import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SheetVersionRepositoryImpl } from './sheetVersionRepositoryImpl';
import { SheetVersion } from '~domain/sheet/model/SheetVersion';
import { prismaClient } from '../prisma/prismaClient';

// Prismaクライアントをモック
vi.mock('../prisma/prismaClient', () => ({
  prismaClient: {
    sheetVersion: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('SheetVersionRepositoryImpl', () => {
  let repository: SheetVersionRepositoryImpl;
  const versionId = 'test-version-id';
  const sheetId = 'test-sheet-id';
  const name = 'Test Sheet';
  const description = 'Test Description';
  const content = 'Test Content';
  const imageUrl = 'https://example.com/image.png';
  const versionName = '2024-01-01 12:00:00';
  const createdAt = new Date('2024-01-01');

  beforeEach(() => {
    repository = new SheetVersionRepositoryImpl();
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a SheetVersion when version exists', async () => {
      const mockVersionData = {
        id: versionId,
        sheetId,
        name,
        description,
        content,
        imageUrl,
        versionName,
        createdAt,
      };

      vi.mocked(prismaClient.sheetVersion.findUnique).mockResolvedValue(mockVersionData);

      const version = await repository.findById(versionId);

      expect(version).toBeInstanceOf(SheetVersion);
      expect(version?.id).toBe(versionId);
      expect(version?.sheetId).toBe(sheetId);
      expect(version?.name).toBe(name);
      expect(version?.description).toBe(description);
      expect(version?.content).toBe(content);
      expect(version?.imageUrl).toBe(imageUrl);
      expect(version?.versionName).toBe(versionName);
      expect(prismaClient.sheetVersion.findUnique).toHaveBeenCalledWith({
        where: { id: versionId },
      });
    });

    it('should return null when version does not exist', async () => {
      vi.mocked(prismaClient.sheetVersion.findUnique).mockResolvedValue(null);

      const version = await repository.findById(versionId);

      expect(version).toBeNull();
      expect(prismaClient.sheetVersion.findUnique).toHaveBeenCalledWith({
        where: { id: versionId },
      });
    });
  });

  describe('findBySheetId', () => {
    it('should return versions for a given sheet ID', async () => {
      const mockVersionsData = [
        {
          id: versionId,
          sheetId,
          name,
          description,
          content,
          imageUrl,
          versionName,
          createdAt,
        },
        {
          id: 'version-id-2',
          sheetId,
          name: 'Sheet 2',
          description: 'Description 2',
          content: 'Content 2',
          imageUrl: 'https://example.com/image2.png',
          versionName: '2024-01-02 12:00:00',
          createdAt: new Date('2024-01-02'),
        },
      ];

      vi.mocked(prismaClient.sheetVersion.findMany).mockResolvedValue(mockVersionsData);

      const versions = await repository.findBySheetId(sheetId);

      expect(versions).toHaveLength(2);
      expect(versions[0]).toBeInstanceOf(SheetVersion);
      expect(versions[0].id).toBe(versionId);
      expect(versions[0].sheetId).toBe(sheetId);
      expect(versions[1].id).toBe('version-id-2');
      expect(prismaClient.sheetVersion.findMany).toHaveBeenCalledWith({
        where: { sheetId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no versions exist for the sheet', async () => {
      vi.mocked(prismaClient.sheetVersion.findMany).mockResolvedValue([]);

      const versions = await repository.findBySheetId(sheetId);

      expect(versions).toEqual([]);
    });
  });

  describe('save', () => {
    it('should create a new version', async () => {
      const version = SheetVersion.reconstruct(
        versionId,
        sheetId,
        name,
        description,
        content,
        imageUrl,
        versionName,
        createdAt
      );

      const mockVersionData = {
        id: versionId,
        sheetId,
        name,
        description,
        content,
        imageUrl,
        versionName,
        createdAt,
      };

      vi.mocked(prismaClient.sheetVersion.create).mockResolvedValue(mockVersionData);

      const savedVersion = await repository.save(version);

      expect(savedVersion).toBeInstanceOf(SheetVersion);
      expect(savedVersion.id).toBe(versionId);
      expect(prismaClient.sheetVersion.create).toHaveBeenCalledWith({
        data: {
          id: versionId,
          sheetId,
          name,
          description,
          content,
          imageUrl,
          versionName,
          createdAt,
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete a version', async () => {
      vi.mocked(prismaClient.sheetVersion.delete).mockResolvedValue({
        id: versionId,
        sheetId,
        name,
        description,
        content,
        imageUrl,
        versionName,
        createdAt,
      });

      await repository.delete(versionId);

      expect(prismaClient.sheetVersion.delete).toHaveBeenCalledWith({
        where: { id: versionId },
      });
    });
  });
});

