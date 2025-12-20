import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateSheetVersion } from './CreateSheetVersion';
import { ISheetRepository } from '~domain/sheet/model/ISheetRepository';
import { ISheetVersionRepository } from '~domain/sheet/model/ISheetVersionRepository';
import { ISheetMarkerRepository } from '~domain/sheet/model/ISheetMarkerRepository';
import { IImageBackupService } from '~domain/sheet/service/IImageBackupService';
import { CreateSheetVersionInput } from '../dto/CreateSheetVersionInput';
import { Sheet } from '~domain/sheet/model/Sheet';
import { SheetVersion } from '~domain/sheet/model/SheetVersion';

// uuidv4をモック
vi.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

describe('CreateSheetVersion', () => {
  let createSheetVersion: CreateSheetVersion;
  let mockSheetRepository: ISheetRepository;
  let mockSheetVersionRepository: ISheetVersionRepository;
  let mockSheetMarkerRepository: ISheetMarkerRepository;
  let mockImageBackupService: IImageBackupService;

  const sheetId = 'test-sheet-id';
  const projectId = 'test-project-id';
  const sheetName = 'Test Sheet';
  const sheetDescription = 'Test Description';
  const sheetContent = 'Test Content';

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

    mockSheetMarkerRepository = {
      findById: vi.fn(),
      findBySheetId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      copyBySheetId: vi.fn(),
      copyMarkersForVersion: vi.fn(),
    };

    mockImageBackupService = {
      backupImage: vi.fn(),
    };

    createSheetVersion = new CreateSheetVersion(
      mockSheetRepository,
      mockSheetVersionRepository,
      mockSheetMarkerRepository,
      mockImageBackupService
    );
  });

  describe('execute', () => {
    it('should create a new sheet version and return SheetVersionOutput', async () => {
      const sheet = Sheet.reconstruct(
        sheetId,
        projectId,
        sheetName,
        sheetDescription,
        sheetContent,
        'https://example.com/img.png',
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      const createdAt = new Date('2024-01-02');
      const savedVersion = SheetVersion.reconstruct(
        'mock-uuid',
        sheetId,
        sheetName,
        sheetDescription,
        sheetContent,
        'https://example.com/img.png',
        '2024-01-02 12:00:00',
        createdAt
      );

      vi.mocked(mockSheetRepository.findById).mockResolvedValue(sheet);
      vi.mocked(mockImageBackupService.backupImage).mockResolvedValue('https://example.com/img.png');
      vi.mocked(mockSheetVersionRepository.save).mockResolvedValue(savedVersion);
      vi.mocked(mockSheetMarkerRepository.copyMarkersForVersion).mockResolvedValue([]);

      const input = new CreateSheetVersionInput();
      const result = await createSheetVersion.execute(sheetId, input);

      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid');
      expect(result.sheetId).toBe(sheetId);
      expect(result.name).toBe(sheetName);
      expect(result.description).toBe(sheetDescription);
      expect(result.content).toBe(sheetContent);
      expect(result.imageUrl).toBe('https://example.com/img.png');
      expect(result.versionName).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(result.createdAt).toEqual(createdAt);

      expect(mockSheetRepository.findById).toHaveBeenCalledWith(sheetId);
      expect(mockImageBackupService.backupImage).toHaveBeenCalledWith('https://example.com/img.png');
      expect(mockSheetVersionRepository.save).toHaveBeenCalled();
      const savedVersionArg = vi.mocked(mockSheetVersionRepository.save).mock.calls[0][0];
      expect(savedVersionArg).toBeInstanceOf(SheetVersion);
      expect(savedVersionArg.sheetId).toBe(sheetId);
      expect(savedVersionArg.name).toBe(sheetName);
      expect(savedVersionArg.description).toBe(sheetDescription);
      expect(savedVersionArg.content).toBe(sheetContent);
      expect(savedVersionArg.imageUrl).toBe('https://example.com/img.png');
    });

    it('should throw error when sheet not found', async () => {
      vi.mocked(mockSheetRepository.findById).mockResolvedValue(null);

      const input = new CreateSheetVersionInput();

      await expect(createSheetVersion.execute(sheetId, input)).rejects.toThrow('Sheet not found');
    });
  });
});

