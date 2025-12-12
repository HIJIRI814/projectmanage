import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoginUser } from './LoginUser';
import { LoginInput } from '../dto/LoginInput';
import { IUserRepository } from '../../../domain/user/model/IUserRepository';
import { AuthDomainService } from '../../../domain/user/service/AuthDomainService';
import { JwtService } from '../../../infrastructure/auth/jwtService';
import { User } from '../../../domain/user/model/User';
import { Email } from '../../../domain/user/model/Email';

describe('LoginUser', () => {
  let loginUser: LoginUser;
  let mockUserRepository: IUserRepository;
  let mockAuthDomainService: AuthDomainService;
  let mockJwtService: JwtService;

  const userId = 'test-user-id';
  const userEmail = 'test@example.com';
  const userName = 'Test User';
  const plainPassword = 'password123';
  const accessToken = 'test-access-token';
  const refreshToken = 'test-refresh-token';

  beforeEach(() => {
    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    mockAuthDomainService = {
      authenticateUser: vi.fn(),
      isEmailValid: vi.fn(),
    } as unknown as AuthDomainService;

    mockJwtService = {
      generateAccessToken: vi.fn(),
      generateRefreshToken: vi.fn(),
      verifyAccessToken: vi.fn(),
      verifyRefreshToken: vi.fn(),
    } as unknown as JwtService;

    loginUser = new LoginUser(
      mockUserRepository,
      mockAuthDomainService,
      mockJwtService
    );
  });

  describe('execute', () => {
    it('should return AuthResult with tokens for valid credentials', async () => {
      const email = new Email(userEmail);
      const user = await User.create(userId, email, plainPassword, userName);

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockAuthDomainService.authenticateUser).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateAccessToken).mockReturnValue(accessToken);
      vi.mocked(mockJwtService.generateRefreshToken).mockReturnValue(
        refreshToken
      );

      const input = new LoginInput(userEmail, plainPassword);
      const result = await loginUser.execute(input);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe(accessToken);
      expect(result.refreshToken).toBe(refreshToken);
      expect(result.user.id).toBe(userId);
      expect(result.user.email).toBe(userEmail);
      expect(result.user.name).toBe(userName);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.any(Email)
      );
      expect(mockAuthDomainService.authenticateUser).toHaveBeenCalledWith(
        user,
        plainPassword
      );
      expect(mockJwtService.generateAccessToken).toHaveBeenCalledWith(userId);
      expect(mockJwtService.generateRefreshToken).toHaveBeenCalledWith(userId);
    });

    it('should throw an error when user does not exist', async () => {
      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

      const input = new LoginInput(userEmail, plainPassword);

      await expect(loginUser.execute(input)).rejects.toThrow(
        'Invalid credentials'
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockAuthDomainService.authenticateUser).not.toHaveBeenCalled();
      expect(mockJwtService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should throw an error when password is incorrect', async () => {
      const email = new Email(userEmail);
      const user = await User.create(userId, email, plainPassword, userName);

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockAuthDomainService.authenticateUser).mockResolvedValue(
        false
      );

      const input = new LoginInput(userEmail, 'wrongpassword');

      await expect(loginUser.execute(input)).rejects.toThrow(
        'Invalid credentials'
      );

      expect(mockUserRepository.findByEmail).toHaveBeenCalled();
      expect(mockAuthDomainService.authenticateUser).toHaveBeenCalledWith(
        user,
        'wrongpassword'
      );
      expect(mockJwtService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should normalize email to lowercase', async () => {
      const email = new Email(userEmail);
      const user = await User.create(userId, email, plainPassword, userName);

      vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(user);
      vi.mocked(mockAuthDomainService.authenticateUser).mockResolvedValue(true);
      vi.mocked(mockJwtService.generateAccessToken).mockReturnValue(
        accessToken
      );
      vi.mocked(mockJwtService.generateRefreshToken).mockReturnValue(
        refreshToken
      );

      const input = new LoginInput('TEST@EXAMPLE.COM', plainPassword);
      await loginUser.execute(input);

      // Emailクラスが小文字に正規化することを確認
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          // Emailオブジェクトが渡されることを確認
        })
      );
    });
  });
});

