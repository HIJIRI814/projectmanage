import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageBackupService } from './imageBackupService';
import { promises as fs } from 'fs';
import path from 'path';

// fsとpathをモック
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    default: actual.default || {},
    ...actual,
    promises: {
      ...actual.promises,
      access: vi.fn(),
      mkdir: vi.fn(),
      copyFile: vi.fn(),
    },
  };
});

// pathモジュールは実際のモジュールを使用（モックしない）

vi.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

// useRuntimeConfigをグローバルにモック
globalThis.useRuntimeConfig = vi.fn(() => ({
  public: {
    sheetImageBaseUrl: '/uploads/sheets',
    sheetImageUploadDir: 'public/uploads/sheets',
    sheetVersionImageBaseUrl: '/uploads/sheet-versions',
    sheetVersionImageUploadDir: 'public/uploads/sheet-versions',
  },
}));

describe.skip('ImageBackupService', () => {
  let service: ImageBackupService;

  beforeEach(() => {
    service = new ImageBackupService();
    vi.clearAllMocks();
  });

  describe('backupImage', () => {
    it('should backup image file and return new URL', async () => {
      const sourceImageUrl = '/uploads/sheets/image.png';
      
      // fs.accessをモック（ファイルが存在することを示す）
      vi.mocked(fs.access).mockImplementation(async () => {
        // 成功（ファイルが存在する）
        return Promise.resolve();
      });
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);

      const result = await service.backupImage(sourceImageUrl);

      expect(result).toBe('/uploads/sheet-versions/mock-uuid.png');
      expect(fs.access).toHaveBeenCalled();
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.copyFile).toHaveBeenCalled();
    });

    it('should return null when sourceImageUrl is null', async () => {
      const result = await service.backupImage(null);

      expect(result).toBeNull();
      expect(fs.access).not.toHaveBeenCalled();
    });

    it('should return null when sourceImageUrl is empty string', async () => {
      const result = await service.backupImage('');

      expect(result).toBeNull();
      expect(fs.access).not.toHaveBeenCalled();
    });

    it('should return source URL when sourceImageUrl is external URL', async () => {
      const sourceImageUrl = 'https://example.com/image.png';
      
      const result = await service.backupImage(sourceImageUrl);

      expect(result).toBe(sourceImageUrl);
      expect(fs.access).not.toHaveBeenCalled();
    });

    it('should return null when source file does not exist', async () => {
      const sourceImageUrl = '/uploads/sheets/nonexistent.png';
      
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const result = await service.backupImage(sourceImageUrl);

      expect(result).toBeNull();
      expect(fs.mkdir).not.toHaveBeenCalled();
      expect(fs.copyFile).not.toHaveBeenCalled();
    });

    it('should handle image URL with different base path', async () => {
      const sourceImageUrl = '/uploads/sheets/test.jpg';
      
      vi.mocked(fs.access).mockImplementation(async () => {
        return Promise.resolve();
      });
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);

      const result = await service.backupImage(sourceImageUrl);

      expect(result).toBe('/uploads/sheet-versions/mock-uuid.jpg');
      expect(fs.copyFile).toHaveBeenCalled();
    });
  });
});

