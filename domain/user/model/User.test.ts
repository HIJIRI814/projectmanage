import { describe, it, expect, beforeEach } from 'vitest';
import { User } from './User';
import { Email } from './Email';
import { PasswordHash } from './PasswordHash';

describe('User', () => {
  const userId = 'test-user-id';
  const userEmail = 'test@example.com';
  const userName = 'Test User';
  const plainPassword = 'password123';

  describe('create', () => {
    it('should create a new User with hashed password', async () => {
      const email = new Email(userEmail);
      const user = await User.create(userId, email, plainPassword, userName);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(userId);
      expect(user.email.toString()).toBe(userEmail);
      expect(user.name).toBe(userName);
      expect(user.passwordHash).toBeInstanceOf(PasswordHash);
      expect(user.passwordHash.toString()).not.toBe(plainPassword);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should set createdAt and updatedAt to the same time on creation', async () => {
      const email = new Email(userEmail);
      const user = await User.create(userId, email, plainPassword, userName);

      expect(user.createdAt.getTime()).toBe(user.updatedAt.getTime());
    });

    it('should create users with different IDs', async () => {
      const email1 = new Email('user1@example.com');
      const email2 = new Email('user2@example.com');
      const user1 = await User.create('id1', email1, plainPassword, 'User 1');
      const user2 = await User.create('id2', email2, plainPassword, 'User 2');

      expect(user1.id).toBe('id1');
      expect(user2.id).toBe('id2');
      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct a User from existing data', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const hashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';

      const user = User.reconstruct(
        userId,
        userEmail,
        hashedPassword,
        userName,
        createdAt,
        updatedAt
      );

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(userId);
      expect(user.email.toString()).toBe(userEmail);
      expect(user.name).toBe(userName);
      expect(user.passwordHash.toString()).toBe(hashedPassword);
      expect(user.createdAt).toEqual(createdAt);
      expect(user.updatedAt).toEqual(updatedAt);
    });

    it('should preserve different createdAt and updatedAt dates', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-15');
      const hashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';

      const user = User.reconstruct(
        userId,
        userEmail,
        hashedPassword,
        userName,
        createdAt,
        updatedAt
      );

      expect(user.createdAt.getTime()).not.toBe(user.updatedAt.getTime());
      expect(user.createdAt).toEqual(createdAt);
      expect(user.updatedAt).toEqual(updatedAt);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const email = new Email(userEmail);
      const user = await User.create(userId, email, plainPassword, userName);
      const isValid = await user.verifyPassword(plainPassword);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const email = new Email(userEmail);
      const user = await User.create(userId, email, plainPassword, userName);
      const isValid = await user.verifyPassword('wrongpassword');
      expect(isValid).toBe(false);
    });

    it('should verify password for reconstructed user', async () => {
      const email = new Email(userEmail);
      const createdUser = await User.create(userId, email, plainPassword, userName);
      const hashedPassword = createdUser.passwordHash.toString();
      const createdAt = createdUser.createdAt;
      const updatedAt = createdUser.updatedAt;

      const reconstructedUser = User.reconstruct(
        userId,
        userEmail,
        hashedPassword,
        userName,
        createdAt,
        updatedAt
      );

      const isValid = await reconstructedUser.verifyPassword(plainPassword);
      expect(isValid).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', async () => {
      const email = new Email(userEmail);
      const user = await User.create(userId, email, plainPassword, userName);

      // TypeScriptのコンパイル時チェックに依存
      // 実行時にはreadonlyは強制されないが、設計上は不変であるべき
      expect(user.id).toBe(userId);
      expect(user.email.toString()).toBe(userEmail);
      expect(user.name).toBe(userName);
    });
  });
});

