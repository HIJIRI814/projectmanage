import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignUpInput } from '../../../application/auth/dto/SignUpInput';
import { UserOutput } from '../../../application/user/dto/UserOutput';
import { AuthResult } from '../../../application/auth/dto/AuthResult';

// モジュール全体をモック
const mockSignUpExecute = vi.fn();
const mockLoginExecute = vi.fn();
const mockSetCookie = vi.fn();

vi.mock('../../../application/auth/useCases/SignUp', () => ({
  SignUp: class {
    constructor(...args: any[]) {}
    execute = mockSignUpExecute;
  },
}));

vi.mock('../../../application/auth/useCases/LoginUser', () => ({
  LoginUser: class {
    constructor(...args: any[]) {}
    execute = mockLoginExecute;
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
  },
}));

vi.mock('../../../infrastructure/user/userCompanyRepositoryImpl', () => ({
  UserCompanyRepositoryImpl: class {
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

// setCookieをグローバルにモック
globalThis.setCookie = mockSetCookie;

// Nuxtの関数をモック
const mockReadBody = globalThis.readBody as any;
const mockCreateError = globalThis.createError as any;

// setCookieをグローバルにモック
globalThis.setCookie = mockSetCookie;

describe('POST /api/auth/signup', () => {
  let handler: any;

  const user = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  const accessToken = 'test-access-token';
  const refreshToken = 'test-refresh-token';

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSignUpExecute.mockClear();
    mockLoginExecute.mockClear();
    mockSetCookie.mockClear();

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
    mockSignUpExecute.mockResolvedValue(new UserOutput(user.id, user.email, user.name));
    mockLoginExecute.mockResolvedValue(
      new AuthResult(accessToken, refreshToken, user)
    );

    const event = {} as any;
    const result = await handler(event);

    expect(result).toEqual({
      user,
    });
    expect(mockSignUpExecute).toHaveBeenCalledWith(expect.any(SignUpInput));
    expect(mockLoginExecute).toHaveBeenCalled();
    // setCookieはh3の関数なので、eventオブジェクトが渡される
    expect(mockSetCookie).toHaveBeenCalled();
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
    mockSignUpExecute.mockRejectedValue(new Error('Email already exists'));

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
    mockSignUpExecute.mockRejectedValue(new Error('Database error'));

    const event = {} as any;

    try {
      await handler(event);
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.statusCode).toBe(500);
      expect(error.statusMessage).toBe('Internal server error');
    }
  });
});

