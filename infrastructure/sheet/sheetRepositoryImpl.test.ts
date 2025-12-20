import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SheetRepositoryImpl } from './sheetRepositoryImpl';
import { Sheet } from '~domain/sheet/model/Sheet';
import { prismaClient } from '../prisma/prismaClient';

describe('SheetRepositoryImpl', () => {
  let repository: SheetRepositoryImpl;
  let projectId: string;

  beforeEach(async () => {
    repository = new SheetRepositoryImpl();
    
    // テスト用のプロジェクトを作成
    const project = await prismaClient.project.create({
      data: {
        id: 'test-project-id',
        name: 'Test Project',
        description: 'Test Description',
      },
    });
    projectId = project.id;
  });

  afterEach(async () => {
    // テストデータのクリーンアップ
    await prismaClient.sheet.deleteMany({
      where: { projectId },
    });
    await prismaClient.project.deleteMany({
      where: { id: projectId },
    });
  });

  describe('save', () => {
    it('should create a new sheet', async () => {
      const sheet = Sheet.create(
        'test-sheet-id',
        projectId,
        'Test Sheet',
        'Test Description',
        'Test Content',
        'https://example.com/img.png'
      );

      const savedSheet = await repository.save(sheet);

      expect(savedSheet).toBeInstanceOf(Sheet);
      expect(savedSheet.id).toBe('test-sheet-id');
      expect(savedSheet.projectId).toBe(projectId);
      expect(savedSheet.name).toBe('Test Sheet');
      expect(savedSheet.description).toBe('Test Description');
      expect(savedSheet.content).toBe('Test Content');
      expect(savedSheet.imageUrl).toBe('https://example.com/img.png');
    });

    it('should update an existing sheet', async () => {
      // 最初のシートを作成
      const sheet = Sheet.create(
        'test-sheet-id',
        projectId,
        'Test Sheet',
        'Test Description',
        'Test Content'
      );
      await repository.save(sheet);

      // シートを更新
      const updatedSheet = Sheet.reconstruct(
        'test-sheet-id',
        projectId,
        'Updated Sheet',
        'Updated Description',
        'Updated Content',
        'https://example.com/new.png',
        sheet.createdAt,
        new Date()
      );

      const savedSheet = await repository.save(updatedSheet);

      expect(savedSheet.name).toBe('Updated Sheet');
      expect(savedSheet.description).toBe('Updated Description');
      expect(savedSheet.content).toBe('Updated Content');
      expect(savedSheet.imageUrl).toBe('https://example.com/new.png');
    });
  });

  describe('findById', () => {
    it('should find a sheet by id', async () => {
      const sheet = Sheet.create(
        'test-sheet-id',
        projectId,
        'Test Sheet',
        'Test Description',
        'Test Content',
        'https://example.com/img.png'
      );
      await repository.save(sheet);

      const foundSheet = await repository.findById('test-sheet-id');

      expect(foundSheet).not.toBeNull();
      expect(foundSheet?.id).toBe('test-sheet-id');
      expect(foundSheet?.name).toBe('Test Sheet');
    });

    it('should return null if sheet not found', async () => {
      const foundSheet = await repository.findById('non-existent-id');

      expect(foundSheet).toBeNull();
    });
  });

  describe('findByProjectId', () => {
    it('should find all sheets for a project', async () => {
      const sheet1 = Sheet.create(
        'test-sheet-id-1',
        projectId,
        'Sheet 1',
        null,
        null,
        null
      );
      const sheet2 = Sheet.create(
        'test-sheet-id-2',
        projectId,
        'Sheet 2',
        null,
        null,
        null
      );

      await repository.save(sheet1);
      await repository.save(sheet2);

      const sheets = await repository.findByProjectId(projectId);

      expect(sheets).toHaveLength(2);
      expect(sheets.map((s) => s.id)).toContain('test-sheet-id-1');
      expect(sheets.map((s) => s.id)).toContain('test-sheet-id-2');
    });

    it('should return empty array if no sheets found', async () => {
      const sheets = await repository.findByProjectId(projectId);

      expect(sheets).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should delete a sheet', async () => {
      const sheet = Sheet.create(
        'test-sheet-id',
        projectId,
        'Test Sheet',
        null,
        null,
        null
      );
      await repository.save(sheet);

      await repository.delete('test-sheet-id');

      const foundSheet = await repository.findById('test-sheet-id');
      expect(foundSheet).toBeNull();
    });
  });
});

