import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RestoreSheetVersion } from './RestoreSheetVersion';
import { ISheetRepository } from '../../../domain/sheet/model/ISheetRepository';
import { ISheetVersionRepository } from '../../../domain/sheet/model/ISheetVersionRepository';
import { RestoreSheetVersionInput } from '../dto/RestoreSheetVersionInput';
import { Sheet } from '../../../domain/sheet/model/Sheet';
import { SheetVersion } from '../../../domain/sheet/model/SheetVersion';

describe('RestoreSheetVersion', () => {
  let restoreSheetVersion: RestoreSheetVersion;
  let mockSheetRepository: ISheetRepository;
  let mockSheetVersionRepository: ISheetVersionRepository;

  const sheetId = 'test-sheet-id';
  const projectId = 'test-project-id';
  const versionId = 'test-version-id';

  beforeEach(() => {
    mockSheetRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    mockSheetVersionRepository = {
      findById: vi.fn(),
      findBySheetId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    restoreSheetVersion = new RestoreSheetVersion(mockSheetRepository, mockSheetVersionRepository);
  });

  describe('execute', () => {
    it('should restore sheet from version and return SheetOutput', async () => {
      const sheet = Sheet.reconstruct(
        sheetId,
        projectId,
        'Current Sheet Name',
        'Current Description',
        'Current Content',
        'https://example.com/current.png',
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      const version = SheetVersion.reconstruct(
        versionId,
        sheetId,
        'Version Sheet Name',
        'Version Description',
        'Version Content',
        'https://example.com/version.png',
        '2024-01-01 12:00:00',
        new Date('2024-01-01')
      );

      const restoredSheet = Sheet.reconstruct(
        sheetId,
        projectId,
        'Version Sheet Name',
        'Version Description',
        'Version Content',
        'https://example.com/version.png',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      vi.mocked(mockSheetVersionRepository.findById).mockResolvedValue(version);
      vi.mocked(mockSheetRepository.findById).mockResolvedValue(sheet);
      vi.mocked(mockSheetRepository.save).mockResolvedValue(restoredSheet);

      const input = new RestoreSheetVersionInput();
      const result = await restoreSheetVersion.execute(sheetId, versionId, input);

      expect(result).toBeDefined();
      expect(result.id).toBe(sheetId);
      expect(result.projectId).toBe(projectId);
      expect(result.name).toBe('Version Sheet Name');
      expect(result.description).toBe('Version Description');
      expect(result.content).toBe('Version Content');
      expect(result.imageUrl).toBe('https://example.com/version.png');

      expect(mockSheetVersionRepository.findById).toHaveBeenCalledWith(versionId);
      expect(mockSheetRepository.findById).toHaveBeenCalledWith(sheetId);
      expect(mockSheetRepository.save).toHaveBeenCalled();
    });

    it('should throw error when version not found', async () => {
      vi.mocked(mockSheetVersionRepository.findById).mockResolvedValue(null);

      const input = new RestoreSheetVersionInput();

      await expect(restoreSheetVersion.execute(sheetId, versionId, input)).rejects.toThrow(
        'SheetVersion not found'
      );
    });

    it('should throw error when sheet not found', async () => {
      const version = SheetVersion.reconstruct(
        versionId,
        sheetId,
        'Version Sheet Name',
        'Version Description',
        'Version Content',
        'https://example.com/version.png',
        '2024-01-01 12:00:00',
        new Date('2024-01-01')
      );

      vi.mocked(mockSheetVersionRepository.findById).mockResolvedValue(version);
      vi.mocked(mockSheetRepository.findById).mockResolvedValue(null);

      const input = new RestoreSheetVersionInput();

      await expect(restoreSheetVersion.execute(sheetId, versionId, input)).rejects.toThrow('Sheet not found');
    });

    it('should throw error when version does not belong to sheet', async () => {
      const sheet = Sheet.reconstruct(
        sheetId,
        projectId,
        'Current Sheet Name',
        'Current Description',
        'Current Content',
        'https://example.com/current.png',
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      const version = SheetVersion.reconstruct(
        versionId,
        'different-sheet-id',
        'Version Sheet Name',
        'Version Description',
        'Version Content',
        'https://example.com/version.png',
        '2024-01-01 12:00:00',
        new Date('2024-01-01')
      );

      vi.mocked(mockSheetVersionRepository.findById).mockResolvedValue(version);
      vi.mocked(mockSheetRepository.findById).mockResolvedValue(sheet);

      const input = new RestoreSheetVersionInput();

      await expect(restoreSheetVersion.execute(sheetId, versionId, input)).rejects.toThrow(
        'SheetVersion does not belong to the specified sheet'
      );
    });
  });
});

