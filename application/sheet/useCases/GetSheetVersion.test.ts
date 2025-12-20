import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetSheetVersion } from './GetSheetVersion';
import { ISheetVersionRepository } from '~domain/sheet/model/ISheetVersionRepository';
import { SheetVersion } from '~domain/sheet/model/SheetVersion';

describe('GetSheetVersion', () => {
  let getSheetVersion: GetSheetVersion;
  let mockSheetVersionRepository: ISheetVersionRepository;

  const versionId = 'test-version-id';
  const sheetId = 'test-sheet-id';

  beforeEach(() => {
    mockSheetVersionRepository = {
      findById: vi.fn(),
      findBySheetId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    getSheetVersion = new GetSheetVersion(mockSheetVersionRepository);
  });

  describe('execute', () => {
    it('should return SheetVersionOutput when version exists', async () => {
      const version = SheetVersion.reconstruct(
        versionId,
        sheetId,
        'Test Sheet',
        'Test Description',
        'Test Content',
        'https://example.com/image.png',
        '2024-01-01 12:00:00',
        new Date('2024-01-01')
      );

      vi.mocked(mockSheetVersionRepository.findById).mockResolvedValue(version);

      const result = await getSheetVersion.execute(versionId);

      expect(result).toBeDefined();
      expect(result.id).toBe(versionId);
      expect(result.sheetId).toBe(sheetId);
      expect(result.name).toBe('Test Sheet');
      expect(result.description).toBe('Test Description');
      expect(result.content).toBe('Test Content');
      expect(result.imageUrl).toBe('https://example.com/image.png');
      expect(result.versionName).toBe('2024-01-01 12:00:00');
      expect(mockSheetVersionRepository.findById).toHaveBeenCalledWith(versionId);
    });

    it('should throw error when version not found', async () => {
      vi.mocked(mockSheetVersionRepository.findById).mockResolvedValue(null);

      await expect(getSheetVersion.execute(versionId)).rejects.toThrow('SheetVersion not found');
    });
  });
});

