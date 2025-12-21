import { describe, it, expect, beforeEach, vi } from 'vitest';

// Supabaseクライアントをモック
const mockCreateUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSupabaseClient = {
  auth: {
    admin: {
      createUser: mockCreateUser,
    },
    signInWithPassword: mockSignInWithPassword,
  },
};

const mockSignUpExecute = vi.fn();
const mockFindById = vi.fn();
const mockFindByEmail = vi.fn();
const mockSave = vi.fn();
const mockFindByUserId = vi.fn();

vi.mock('~/server/utils/supabase', () => ({
  createServerSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('../../../application/auth/useCases/SignUp', () => ({
  SignUp: class {
    constructor(...args: any[]) {}
    execute = mockSignUpExecute;
  },
}));

vi.mock('../../../application/user/useCases/CreateUser', () => ({
  CreateUser: class {
    constructor(...args: any[]) {}
  },
}));

vi.mock('../../../infrastructure/auth/userRepositoryImpl', () => ({
  UserRepositoryImpl: class {
    constructor() {}
    findById = mockFindById;
    findByEmail = mockFindByEmail;
    save = mockSave;
  },
}));

vi.mock('../../../infrastructure/user/userCompanyRepositoryImpl', () => ({
  UserCompanyRepositoryImpl: class {
    constructor() {}
    findByUserId = mockFindByUserId;
  },
}));

// Nuxtの関数をモック
const mockReadBody = globalThis.readBody as any;
const mockCreateError = globalThis.createError as any;

describe('POST /api/auth/signup', () => {
  let handler: any;

  const user = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCreateUser.mockClear();
    mockSignInWithPassword.mockClear();
    mockSignUpExecute.mockClear();
    mockFindById.mockClear();
    mockFindByEmail.mockClear();
    mockSave.mockClear();
    mockFindByUserId.mockClear();

    // ハンドラーを動的にインポート
    const module = await import('./signup.post');
    handler = module.default;
  });

  it('should create user and return user data with auto-login', async () => {
    const body = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    mockReadBody.mockResolvedValue(body);
    mockCreateUser.mockResolvedValue({
      data: {
        user: { id: user.id, email: user.email },
      },
      error: null,
    });
    mockSignInWithPassword.mockResolvedValue({
      data: {
        session: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
        },
      },
      error: null,
    });
    mockFindByEmail.mockResolvedValue(null); // ユーザーが存在しない
    mockSave.mockResolvedValue({
      id: user.id,
      email: { toString: () => user.email },
      name: user.name,
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
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        name: body.name,
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
      name: 'Test User',
    };

    mockReadBody.mockResolvedValue(body);

    const event = {} as any;

    try {
      await handler(event);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toBe('Validation error');
    }
  });

  it('should return 400 for validation errors - short password', async () => {
    const body = {
      email: 'test@example.com',
      password: 'short',
      name: 'Test User',
    };

    mockReadBody.mockResolvedValue(body);

    const event = {} as any;

    try {
      await handler(event);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toBe('Validation error');
    }
  });

  it('should return 400 for validation errors - empty name', async () => {
    const body = {
      email: 'test@example.com',
      password: 'password123',
      name: '',
    };

    mockReadBody.mockResolvedValue(body);

    const event = {} as any;

    try {
      await handler(event);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(400);
      expect(error.statusMessage).toBe('Validation error');
    }
  });

  it('should return 409 for duplicate email', async () => {
    const body = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    mockReadBody.mockResolvedValue(body);
    mockCreateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    });

    const event = {} as any;

    try {
      await handler(event);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(409);
      expect(error.statusMessage).toBe('Email already exists');
    }
  });

  it('should return 500 for unexpected errors', async () => {
    const body = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    mockReadBody.mockResolvedValue(body);
    mockCreateUser.mockResolvedValue({
      data: {
        user: { id: 'test-user-id', email: 'test@example.com' },
      },
      error: null,
    });
    mockFindByEmail.mockRejectedValue(new Error('Database error'));

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

