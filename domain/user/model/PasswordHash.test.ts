import { describe, it, expect } from 'vitest';
import { PasswordHash } from './PasswordHash';

describe('PasswordHash', () => {
  describe('create', () => {
    it('should create a PasswordHash from a plain password', async () => {
      const passwordHash = await PasswordHash.create('password123');
      expect(passwordHash).toBeInstanceOf(PasswordHash);
      expect(passwordHash.toString()).not.toBe('password123');
      expect(passwordHash.toString().length).toBeGreaterThan(0);
    });

    it('should throw an error for passwords shorter than 8 characters', async () => {
      await expect(PasswordHash.create('short')).rejects.toThrow(
        'Password must be at least 8 characters long'
      );
      await expect(PasswordHash.create('')).rejects.toThrow(
        'Password must be at least 8 characters long'
      );
    });

    it('should accept passwords with exactly 8 characters', async () => {
      const passwordHash = await PasswordHash.create('12345678');
      expect(passwordHash).toBeInstanceOf(PasswordHash);
    });

    it('should create different hashes for the same password', async () => {
      const hash1 = await PasswordHash.create('password123');
      const hash2 = await PasswordHash.create('password123');
      // bcryptは毎回異なるハッシュを生成する（saltが異なるため）
      expect(hash1.toString()).not.toBe(hash2.toString());
    });
  });

  describe('fromHash', () => {
    it('should create a PasswordHash from an existing hash', () => {
      const existingHash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';
      const passwordHash = PasswordHash.fromHash(existingHash);
      expect(passwordHash).toBeInstanceOf(PasswordHash);
      expect(passwordHash.toString()).toBe(existingHash);
    });
  });

  describe('verify', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'password123';
      const passwordHash = await PasswordHash.create(plainPassword);
      const isValid = await passwordHash.verify(plainPassword);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const passwordHash = await PasswordHash.create('password123');
      const isValid = await passwordHash.verify('wrongpassword');
      expect(isValid).toBe(false);
    });

    it('should verify password created from hash', async () => {
      const plainPassword = 'password123';
      const passwordHash1 = await PasswordHash.create(plainPassword);
      const hashString = passwordHash1.toString();
      const passwordHash2 = PasswordHash.fromHash(hashString);
      const isValid = await passwordHash2.verify(plainPassword);
      expect(isValid).toBe(true);
    });

    it('should return false for empty password', async () => {
      const passwordHash = await PasswordHash.create('password123');
      const isValid = await passwordHash.verify('');
      expect(isValid).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the hash string', async () => {
      const passwordHash = await PasswordHash.create('password123');
      const hashString = passwordHash.toString();
      expect(typeof hashString).toBe('string');
      expect(hashString.length).toBeGreaterThan(0);
      expect(hashString).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });
  });
});

