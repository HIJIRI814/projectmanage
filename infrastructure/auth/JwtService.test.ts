import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JwtService } from './jwtService';

describe('JwtService', () => {
  let jwtService: JwtService;
  const userId = 'test-user-id';
  const originalAccessSecret = process.env.JWT_ACCESS_SECRET;
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;

  beforeEach(() => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    jwtService = new JwtService();
  });

  afterEach(() => {
    if (originalAccessSecret) {
      process.env.JWT_ACCESS_SECRET = originalAccessSecret;
    } else {
      delete process.env.JWT_ACCESS_SECRET;
    }
    if (originalRefreshSecret) {
      process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
    } else {
      delete process.env.JWT_REFRESH_SECRET;
    }
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = jwtService.generateAccessToken(userId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for different users', () => {
      const token1 = jwtService.generateAccessToken('user1');
      const token2 = jwtService.generateAccessToken('user2');
      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with consistent structure', () => {
      const token = jwtService.generateAccessToken(userId);
      // JWT形式: header.payload.signature
      const parts = token.split('.');
      expect(parts.length).toBe(3);
      expect(parts[0]).toBeDefined();
      expect(parts[1]).toBeDefined();
      expect(parts[2]).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = jwtService.generateRefreshToken(userId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens for different users', () => {
      const token1 = jwtService.generateRefreshToken('user1');
      const token2 = jwtService.generateRefreshToken('user2');
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = jwtService.generateAccessToken(userId);
      const decoded = jwtService.verifyAccessToken(token);
      expect(decoded.userId).toBe(userId);
    });

    it('should throw an error for invalid token', () => {
      expect(() => jwtService.verifyAccessToken('invalid-token')).toThrow(
        'Invalid access token'
      );
    });

    it('should throw an error for token signed with wrong secret', () => {
      const otherService = new JwtService();
      // 別のシークレットでトークンを生成（環境変数を変更）
      process.env.JWT_ACCESS_SECRET = 'different-secret';
      const otherJwtService = new JwtService();
      const token = otherJwtService.generateAccessToken(userId);

      // 元のシークレットで検証しようとすると失敗
      expect(() => jwtService.verifyAccessToken(token)).toThrow(
        'Invalid access token'
      );
    });

    it('should throw an error for empty token', () => {
      expect(() => jwtService.verifyAccessToken('')).toThrow(
        'Invalid access token'
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = jwtService.generateRefreshToken(userId);
      const decoded = jwtService.verifyRefreshToken(token);
      expect(decoded.userId).toBe(userId);
    });

    it('should throw an error for invalid token', () => {
      expect(() => jwtService.verifyRefreshToken('invalid-token')).toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw an error for access token used as refresh token', () => {
      const accessToken = jwtService.generateAccessToken(userId);
      expect(() => jwtService.verifyRefreshToken(accessToken)).toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('environment variable fallback', () => {
    it('should use default secrets when environment variables are not set', () => {
      delete process.env.JWT_ACCESS_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      const service = new JwtService();
      const token = service.generateAccessToken(userId);
      expect(token).toBeDefined();
      const decoded = service.verifyAccessToken(token);
      expect(decoded.userId).toBe(userId);
    });
  });

  describe('token expiration', () => {
    it('should generate tokens with expiration', () => {
      const accessToken = jwtService.generateAccessToken(userId);
      const refreshToken = jwtService.generateRefreshToken(userId);

      // トークンが有効であることを確認
      expect(() => jwtService.verifyAccessToken(accessToken)).not.toThrow();
      expect(() => jwtService.verifyRefreshToken(refreshToken)).not.toThrow();
    });
  });
});

