import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginInput } from '../../../application/auth/dto/LoginInput';
import { AuthResult } from '../../../application/auth/dto/AuthResult';

// モジュール全体をモック
const mockExecute = vi.fn();

vi.mock('../../../application/auth/useCases/LoginUser', () => ({
  LoginUser: class {
    constructor(...args: any[]) {}
    execute = mockExecute;
  },
}));

vi.mock('../../../infrastructure/auth/userRepositoryImpl', () => ({
  UserRepositoryImpl: class {
    constructor() {}
  },
}));

vi.mock('../../../domain/user/service/AuthDomainService', () => ({
  AuthDomainService: class {
    constructor() {}
  },
}));

vi.mock('../../../infrastructure/auth/jwtService', () => ({
  JwtService: class {
    constructor() {}
  },
}));

// Nuxtの関数をモック（vitest.setup.tsでグローバルに定義されている）
const mockReadBody = globalThis.readBody as any;
const mockCreateError = globalThis.createError as any;

describe('POST /api/auth/login', () => {
  let handler: any;

  const accessToken = 'test-access-token';
  const refreshToken = 'test-refresh-token';
  const user = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockExecute.mockClear();

    // ハンドラーを動的にインポート
    const module = await import('./login.post');
    handler = module.default;
  });

  it('should return tokens and user data for valid credentials', async () => {
    const body = {
      email: 'test@example.com',
      password: 'password123',
    };

    mockReadBody.mockResolvedValue(body);
    mockExecute.mockResolvedValue(
      new AuthResult(accessToken, refreshToken, user)
    );

    const event = {} as any;
    const result = await handler(event);

    expect(result).toEqual({
      accessToken,
      refreshToken,
      user,
    });
    expect(mockExecute).toHaveBeenCalledWith(expect.any(LoginInput));
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
    mockExecute.mockRejectedValue(new Error('Invalid credentials'));

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
    mockExecute.mockRejectedValue(new Error('Database error'));

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
