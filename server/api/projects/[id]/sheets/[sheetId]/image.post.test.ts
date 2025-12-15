import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Sheet } from '~/domain/sheet/model/Sheet';
import { UserType } from '~/domain/user/model/UserType';

vi.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

const mockFindById = vi.fn();
const mockSave = vi.fn();
const mockFindUserById = vi.fn();
const mockFindByUserId = vi.fn();
const mockVerifyAccessToken = vi.fn();
const mockMkdir = vi.fn();
const mockWriteFile = vi.fn();

vi.mock('fs', () => ({
  default: {
    promises: {
      mkdir: mockMkdir,
      writeFile: mockWriteFile,
    },
  },
  promises: {
    mkdir: mockMkdir,
    writeFile: mockWriteFile,
  },
}));

vi.mock('~/infrastructure/sheet/sheetRepositoryImpl', () => ({
  SheetRepositoryImpl: class {
    findById = mockFindById;
    save = mockSave;
  },
}));

vi.mock('~/infrastructure/auth/userRepositoryImpl', () => ({
  UserRepositoryImpl: class {
    findById = mockFindUserById;
  },
}));

vi.mock('~/infrastructure/user/userCompanyRepositoryImpl', () => ({
  UserCompanyRepositoryImpl: class {
    findByUserId = mockFindByUserId;
  },
}));

vi.mock('~/infrastructure/auth/jwtService', () => ({
  JwtService: class {
    verifyAccessToken = mockVerifyAccessToken;
  },
}));

// グローバルモック
const mockGetCookie = vi.fn();
const mockReadMultipartFormData = vi.fn();
const mockUseRuntimeConfig = vi.fn(() => ({
  public: {},
}));
const mockGetRouterParam = vi.fn((event: any, key: string) => event?.params?.[key]);

globalThis.getCookie = mockGetCookie as any;
globalThis.readMultipartFormData = mockReadMultipartFormData as any;
globalThis.useRuntimeConfig = mockUseRuntimeConfig as any;
globalThis.getRouterParam = mockGetRouterParam as any;

describe('POST /api/projects/:id/sheets/:sheetId/image', () => {
  let handler: any;
  const projectId = 'project-1';
  const sheetId = 'sheet-1';

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetCookie.mockReturnValue('access-token');
    mockVerifyAccessToken.mockReturnValue({ userId: 'user-1' });
    mockFindUserById.mockResolvedValue({
      id: 'user-1',
    });
    mockFindByUserId.mockResolvedValue([
      {
        id: 'user-company-1',
        userId: 'user-1',
        companyId: 'company-1',
        userType: {
          toNumber: () => UserType.ADMINISTRATOR,
        },
      },
    ]);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);

    const sheet = Sheet.create(sheetId, projectId, 'Sheet', null, null, null);
    mockFindById.mockResolvedValue(sheet);

    // ハンドラーを動的に読み込み
    const module = await import('./image.post');
    handler = module.default;
  });

  it('should upload and update image URL', async () => {
    const fileBuffer = Buffer.from('1234');
    mockReadMultipartFormData.mockResolvedValue([
      {
        name: 'file',
        filename: 'image.png',
        type: 'image/png',
        data: fileBuffer,
      },
    ]);

    const savedSheet = Sheet.reconstruct(
      sheetId,
      projectId,
      'Sheet',
      null,
      null,
      '/uploads/sheets/mock-uuid.png',
      new Date('2024-01-01'),
      new Date('2024-01-02')
    );
    mockSave.mockResolvedValue(savedSheet);

    const event = {
      context: {},
      path: `/api/projects/${projectId}/sheets/${sheetId}/image`,
      params: { id: projectId, sheetId },
    } as any;

    const result = await handler(event);

    expect(mockMkdir).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalled();
    expect(result.imageUrl).toBe('/uploads/sheets/mock-uuid.png');
  });

  it('should reject unsupported file type', async () => {
    mockReadMultipartFormData.mockResolvedValue([
      {
        name: 'file',
        filename: 'file.txt',
        type: 'text/plain',
        data: Buffer.from('1234'),
      },
    ]);

    const event = {
      params: { id: projectId, sheetId },
    } as any;

    await expect(handler(event)).rejects.toHaveProperty('statusCode', 400);
  });

  it('should reject when file is missing', async () => {
    mockReadMultipartFormData.mockResolvedValue([]);
    const event = { params: { id: projectId, sheetId } } as any;
    await expect(handler(event)).rejects.toHaveProperty('statusCode', 400);
  });

  it('should reject when file is too large', async () => {
    const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 0);
    mockReadMultipartFormData.mockResolvedValue([
      {
        name: 'file',
        filename: 'big.png',
        type: 'image/png',
        data: bigBuffer,
      },
    ]);
    const event = { params: { id: projectId, sheetId } } as any;
    await expect(handler(event)).rejects.toHaveProperty('statusCode', 400);
  });
});


