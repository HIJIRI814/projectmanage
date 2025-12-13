import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListSheetVersions } from './ListSheetVersions';
import { ISheetVersionRepository } from '../../../domain/sheet/model/ISheetVersionRepository';
import { SheetVersion } from '../../../domain/sheet/model/SheetVersion';

describe('ListSheetVersions', () => {
  let listSheetVersions: ListSheetVersions;
  let mockSheetVersionRepository: ISheetVersionRepository;

  const sheetId = 'test-sheet-id';

  beforeEach(() => {
    mockSheetVersionRepository = {
      findById: vi.fn(),
      findBySheetId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    listSheetVersions = new ListSheetVersions(mockSheetVersionRepository);
  });

  describe('execute', () => {
    it('should return list of sheet versions', async () => {
      const version1 = SheetVersion.reconstruct(
        'version-id-1',
        sheetId,
        'Sheet Name 1',
        'Description 1',
        'Content 1',
        '2024-01-01 12:00:00',
        new Date('2024-01-01')
      );

      const version2 = SheetVersion.reconstruct(
        'version-id-2',
        sheetId,
        'Sheet Name 2',
        'Description 2',
        'Content 2',
        '2024-01-02 12:00:00',
        new Date('2024-01-02')
      );

      vi.mocked(mockSheetVersionRepository.findBySheetId).mockResolvedValue([version1, version2]);

      const result = await listSheetVersions.execute(sheetId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('version-id-1');
      expect(result[0].sheetId).toBe(sheetId);
      expect(result[0].name).toBe('Sheet Name 1');
      expect(result[1].id).toBe('version-id-2');
      expect(result[1].name).toBe('Sheet Name 2');
      expect(mockSheetVersionRepository.findBySheetId).toHaveBeenCalledWith(sheetId);
    });

    it('should return empty array when no versions exist', async () => {
      vi.mocked(mockSheetVersionRepository.findBySheetId).mockResolvedValue([]);

      const result = await listSheetVersions.execute(sheetId);

      expect(result).toEqual([]);
    });
  });
});

