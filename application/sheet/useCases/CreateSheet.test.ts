import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateSheet } from './CreateSheet';
import { ISheetRepository } from '../../../domain/sheet/model/ISheetRepository';
import { CreateSheetInput } from '../dto/CreateSheetInput';
import { Sheet } from '../../../domain/sheet/model/Sheet';

describe('CreateSheet', () => {
  let createSheet: CreateSheet;
  let mockSheetRepository: ISheetRepository;

  const projectId = 'project-id';
  const sheetName = 'Test Sheet';
  const sheetDescription = 'Test Description';
  const sheetContent = 'Test Content';
  const sheetImageUrl = 'https://example.com/img.png';

  beforeEach(() => {
    mockSheetRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    createSheet = new CreateSheet(mockSheetRepository);
  });

  describe('execute', () => {
    it('should create a new sheet and return SheetOutput', async () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-01');
      const savedSheet = Sheet.reconstruct(
        'generated-id',
        projectId,
        sheetName,
        sheetDescription,
        sheetContent,
        sheetImageUrl,
        createdAt,
        updatedAt
      );

      vi.mocked(mockSheetRepository.save).mockResolvedValue(savedSheet);

      const input = new CreateSheetInput(sheetName, sheetDescription, sheetContent, sheetImageUrl);
      const result = await createSheet.execute(projectId, input);

      expect(result).toBeDefined();
      expect(result.id).toBe('generated-id');
      expect(result.projectId).toBe(projectId);
      expect(result.name).toBe(sheetName);
      expect(result.description).toBe(sheetDescription);
      expect(result.content).toBe(sheetContent);
      expect(result.imageUrl).toBe(sheetImageUrl);
      expect(result.createdAt).toEqual(createdAt);
      expect(result.updatedAt).toEqual(updatedAt);

      expect(mockSheetRepository.save).toHaveBeenCalled();
      const savedSheetArg = vi.mocked(mockSheetRepository.save).mock.calls[0][0];
      expect(savedSheetArg).toBeInstanceOf(Sheet);
      expect(savedSheetArg.name).toBe(sheetName);
      expect(savedSheetArg.description).toBe(sheetDescription);
      expect(savedSheetArg.content).toBe(sheetContent);
      expect(savedSheetArg.imageUrl).toBe(sheetImageUrl);
    });

    it('should create a sheet with null optional fields when not provided', async () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-01');
      const savedSheet = Sheet.reconstruct(
        'generated-id',
        projectId,
        sheetName,
        null,
        null,
        null,
        createdAt,
        updatedAt
      );

      vi.mocked(mockSheetRepository.save).mockResolvedValue(savedSheet);

      const input = new CreateSheetInput(sheetName);
      const result = await createSheet.execute(projectId, input);

      expect(result).toBeDefined();
      expect(result.name).toBe(sheetName);
      expect(result.description).toBeNull();
      expect(result.content).toBeNull();
      expect(result.imageUrl).toBeNull();

      expect(mockSheetRepository.save).toHaveBeenCalled();
      const savedSheetArg = vi.mocked(mockSheetRepository.save).mock.calls[0][0];
      expect(savedSheetArg.description).toBeNull();
      expect(savedSheetArg.content).toBeNull();
      expect(savedSheetArg.imageUrl).toBeNull();
    });
  });
});

