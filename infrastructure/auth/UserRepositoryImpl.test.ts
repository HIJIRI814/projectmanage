import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserRepositoryImpl } from './userRepositoryImpl';
import { User } from '../../domain/user/model/User';
import { Email } from '../../domain/user/model/Email';
import { prismaClient } from '../prisma/prismaClient';

// Prismaクライアントをモック
vi.mock('../prisma/prismaClient', () => ({
  prismaClient: {
    user: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('UserRepositoryImpl', () => {
  let repository: UserRepositoryImpl;
  const userId = 'test-user-id';
  const userEmail = 'test@example.com';
  const userName = 'Test User';
  const hashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';
  const createdAt = new Date('2024-01-01');
  const updatedAt = new Date('2024-01-02');

  beforeEach(() => {
    repository = new UserRepositoryImpl();
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a User when user exists', async () => {
      const mockUserData = {
        id: userId,
        email: userEmail,
        passwordHash: hashedPassword,
        name: userName,
        createdAt,
        updatedAt,
      };

      vi.mocked(prismaClient.user.findUnique).mockResolvedValue(mockUserData);

      const user = await repository.findById(userId);

      expect(user).toBeInstanceOf(User);
      expect(user?.id).toBe(userId);
      expect(user?.email.toString()).toBe(userEmail);
      expect(user?.name).toBe(userName);
      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('should return null when user does not exist', async () => {
      vi.mocked(prismaClient.user.findUnique).mockResolvedValue(null);

      const user = await repository.findById(userId);

      expect(user).toBeNull();
      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a User when user exists', async () => {
      const email = new Email(userEmail);
      const mockUserData = {
        id: userId,
        email: userEmail,
        passwordHash: hashedPassword,
        name: userName,
        createdAt,
        updatedAt,
      };

      vi.mocked(prismaClient.user.findUnique).mockResolvedValue(mockUserData);

      const user = await repository.findByEmail(email);

      expect(user).toBeInstanceOf(User);
      expect(user?.id).toBe(userId);
      expect(user?.email.toString()).toBe(userEmail);
      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: userEmail },
      });
    });

    it('should return null when user does not exist', async () => {
      const email = new Email(userEmail);
      vi.mocked(prismaClient.user.findUnique).mockResolvedValue(null);

      const user = await repository.findByEmail(email);

      expect(user).toBeNull();
      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email: userEmail },
      });
    });
  });

  describe('save', () => {
    it('should create a new user when user does not exist', async () => {
      const email = new Email(userEmail);
      const user = User.reconstruct(
        userId,
        userEmail,
        hashedPassword,
        userName,
        createdAt,
        updatedAt
      );

      const mockUserData = {
        id: userId,
        email: userEmail,
        passwordHash: hashedPassword,
        name: userName,
        createdAt,
        updatedAt,
      };

      vi.mocked(prismaClient.user.upsert).mockResolvedValue(mockUserData);

      const savedUser = await repository.save(user);

      expect(savedUser).toBeInstanceOf(User);
      expect(savedUser.id).toBe(userId);
      expect(prismaClient.user.upsert).toHaveBeenCalledWith({
        where: { id: userId },
        update: {
          email: userEmail,
          passwordHash: hashedPassword,
          name: userName,
          updatedAt: expect.any(Date),
        },
        create: {
          id: userId,
          email: userEmail,
          passwordHash: hashedPassword,
          name: userName,
          createdAt,
          updatedAt,
        },
      });
    });

    it('should update an existing user', async () => {
      const email = new Email(userEmail);
      const user = User.reconstruct(
        userId,
        userEmail,
        hashedPassword,
        'Updated Name',
        createdAt,
        updatedAt
      );

      const mockUserData = {
        id: userId,
        email: userEmail,
        passwordHash: hashedPassword,
        name: 'Updated Name',
        createdAt,
        updatedAt: new Date(),
      };

      vi.mocked(prismaClient.user.upsert).mockResolvedValue(mockUserData);

      const savedUser = await repository.save(user);

      expect(savedUser).toBeInstanceOf(User);
      expect(savedUser.name).toBe('Updated Name');
      expect(prismaClient.user.upsert).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      vi.mocked(prismaClient.user.delete).mockResolvedValue({
        id: userId,
        email: userEmail,
        passwordHash: hashedPassword,
        name: userName,
        createdAt,
        updatedAt,
      });

      await repository.delete(userId);

      expect(prismaClient.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});

