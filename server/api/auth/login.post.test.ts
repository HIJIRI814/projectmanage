import { describe, it, expect, beforeEach, vi } from 'vitest';

// Supabaseクライアントをモック
const mockSignInWithPassword = vi.fn();
const mockSupabaseClient = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
  },
};

const mockFindById = vi.fn();
const mockFindByUserId = vi.fn();

vi.mock('~/server/utils/supabase', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('../../../infrastructure/auth/userRepositoryImpl', () => ({
  UserRepositoryImpl: class {
    constructor() {}
    findById = mockFindById;
  },
}));

vi.mock('../../../infrastructure/user/userCompanyRepositoryImpl', () => ({
  UserCompanyRepositoryImpl: class {
    constructor() {}
    findByUserId = mockFindByUserId;
  },
}));

// Nuxtの関数をモック（vitest.setup.tsでグローバルに定義されている）
const mockReadBody = globalThis.readBody as any;
const mockCreateError = globalThis.createError as any;

describe('POST /api/auth/login', () => {
  let handler: any;

  const user = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSignInWithPassword.mockClear();
    mockFindById.mockClear();
    mockFindByUserId.mockClear();

    // ハンドラーを動的にインポート
    const module = await import('./login.post');
    handler = module.default;
  });

  it('should return user data for valid credentials', async () => {
    const body = {
      email: 'test@example.com',
      password: 'password123',
    };

    mockReadBody.mockResolvedValue(body);
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: user.id, email: user.email },
        session: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
        },
      },
      error: null,
    });
    mockFindById.mockResolvedValue({
      id: user.id,
      email: { toString: () => user.email },
      name: user.name,
    });
    mockFindByUserId.mockResolvedValue([]);

    const event = {} as any;
    const result = await handler(event);

    expect(result).toEqual({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: null,
        userCompanies: [],
      },
    });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: body.email,
      password: body.password,
    });
  });

  it('should return 400 for validation errors - invalid email', async () => {
    const body = {
      email: 'invalid-email',
      password: 'password123',
    };

    mockReadBody.mockResolvedValue(body);

    const event = {} as any;

    try {
      await handler(event);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toContain('Validation error');
    }
  });

  it('should return 400 for validation errors - short password', async () => {
    const body = {
      email: 'test@example.com',
      password: 'short',
    };

    mockReadBody.mockResolvedValue(body);

    const event = {} as any;

    try {
      await handler(event);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toContain('Validation error');
    }
  });

  it('should return 401 for invalid credentials', async () => {
    const body = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    mockReadBody.mockResolvedValue(body);
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    });

    const event = {} as any;

    try {
      await handler(event);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(401);
      expect(error.statusMessage).toBe('Invalid credentials');
    }
  });

  it('should return 500 for unexpected errors', async () => {
    const body = {
      email: 'test@example.com',
      password: 'password123',
    };

    mockReadBody.mockResolvedValue(body);
    mockSignInWithPassword.mockRejectedValue(new Error('Database error'));

    const event = {} as any;

    try {
      await handler(event);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(500);
      expect(error.statusMessage).toContain('Internal server error');
    }
  });
});
