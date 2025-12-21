import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateSheetMarkerComment } from './CreateSheetMarkerComment';
import { ISheetMarkerRepository } from '~domain/sheet/model/ISheetMarkerRepository';
import { ISheetMarkerCommentRepository } from '~domain/sheet/model/ISheetMarkerCommentRepository';
import { IUserRepository } from '~domain/user/model/IUserRepository';
import { CreateSheetMarkerCommentInput } from '../dto/CreateSheetMarkerCommentInput';
import { SheetMarker } from '~domain/sheet/model/SheetMarker';
import { SheetMarkerComment } from '~domain/sheet/model/SheetMarkerComment';
import { User } from '~domain/user/model/User';
import { Email } from '~domain/user/model/Email';
import { PasswordHash } from '~domain/user/model/PasswordHash';

describe('CreateSheetMarkerComment', () => {
  let createSheetMarkerComment: CreateSheetMarkerComment;
  let mockSheetMarkerRepository: ISheetMarkerRepository;
  let mockSheetMarkerCommentRepository: ISheetMarkerCommentRepository;
  let mockUserRepository: IUserRepository;

  const markerId = 'marker-id';
  const userId = 'user-id';
  const sheetId = 'sheet-id';

  beforeEach(async () => {
    mockSheetMarkerRepository = {
      findById: vi.fn(),
      findBySheetId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      copyMarkersForVersion: vi.fn(),
    };

    mockSheetMarkerCommentRepository = {
      save: vi.fn(),
      findByMarkerId: vi.fn(),
      findById: vi.fn(),
    };

    mockUserRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    createSheetMarkerComment = new CreateSheetMarkerComment(
      mockSheetMarkerRepository,
      mockSheetMarkerCommentRepository,
      mockUserRepository
    );
  });

  describe('execute', () => {
    it('should create a top-level comment', async () => {
      const marker = SheetMarker.reconstruct(
        markerId,
        sheetId,
        null,
        'number',
        10,
        20,
        null,
        null,
        null,
        new Date(),
        new Date()
      );

      const user = User.reconstruct(
        userId,
        'test@example.com',
        'hashed-password',
        'Test User',
        new Date(),
        new Date()
      );

      const comment = SheetMarkerComment.create(
        'comment-id',
        markerId,
        userId,
        null,
        'Test comment'
      );

      vi.mocked(mockSheetMarkerRepository.findById).mockResolvedValue(marker);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockSheetMarkerCommentRepository.save).mockResolvedValue(comment);

      const input = new CreateSheetMarkerCommentInput('Test comment', null);
      const result = await createSheetMarkerComment.execute(markerId, userId, input);

      expect(result.id).toBe('comment-id');
      expect(result.markerId).toBe(markerId);
      expect(result.userId).toBe(userId);
      expect(result.parentCommentId).toBeNull();
      expect(result.content).toBe('Test comment');
      expect(result.userName).toBe('Test User');
      expect(mockSheetMarkerRepository.findById).toHaveBeenCalledWith(markerId);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockSheetMarkerCommentRepository.save).toHaveBeenCalled();
    });

    it('should create a reply comment', async () => {
      const marker = SheetMarker.reconstruct(
        markerId,
        sheetId,
        null,
        'number',
        10,
        20,
        null,
        null,
        null,
        new Date(),
        new Date()
      );

      const user = User.reconstruct(
        userId,
        'test@example.com',
        'hashed-password',
        'Test User',
        new Date(),
        new Date()
      );

      const parentComment = SheetMarkerComment.reconstruct(
        'parent-comment-id',
        markerId,
        userId,
        null,
        'Parent comment',
        new Date(),
        new Date()
      );

      const reply = SheetMarkerComment.create(
        'reply-id',
        markerId,
        userId,
        'parent-comment-id',
        'Reply comment'
      );

      vi.mocked(mockSheetMarkerRepository.findById).mockResolvedValue(marker);
      vi.mocked(mockSheetMarkerCommentRepository.findById).mockResolvedValue(parentComment);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockSheetMarkerCommentRepository.save).mockResolvedValue(reply);

      const input = new CreateSheetMarkerCommentInput('Reply comment', 'parent-comment-id');
      const result = await createSheetMarkerComment.execute(markerId, userId, input);

      expect(result.id).toBe('reply-id');
      expect(result.parentCommentId).toBe('parent-comment-id');
      expect(result.content).toBe('Reply comment');
      expect(mockSheetMarkerCommentRepository.findById).toHaveBeenCalledWith('parent-comment-id');
    });

    it('should throw error if marker not found', async () => {
      vi.mocked(mockSheetMarkerRepository.findById).mockResolvedValue(null);

      const input = new CreateSheetMarkerCommentInput('Test comment', null);

      await expect(
        createSheetMarkerComment.execute(markerId, userId, input)
      ).rejects.toThrow('Marker not found');
    });

    it('should throw error if parent comment not found', async () => {
      const marker = SheetMarker.reconstruct(
        markerId,
        sheetId,
        null,
        'number',
        10,
        20,
        null,
        null,
        null,
        new Date(),
        new Date()
      );

      vi.mocked(mockSheetMarkerRepository.findById).mockResolvedValue(marker);
      vi.mocked(mockSheetMarkerCommentRepository.findById).mockResolvedValue(null);

      const input = new CreateSheetMarkerCommentInput('Reply comment', 'parent-comment-id');

      await expect(
        createSheetMarkerComment.execute(markerId, userId, input)
      ).rejects.toThrow('Parent comment not found');
    });

    it('should throw error if trying to reply to a reply', async () => {
      const marker = SheetMarker.reconstruct(
        markerId,
        sheetId,
        null,
        'number',
        10,
        20,
        null,
        null,
        null,
        new Date(),
        new Date()
      );

      const parentReply = SheetMarkerComment.reconstruct(
        'parent-reply-id',
        markerId,
        userId,
        'grandparent-id',
        'Parent reply',
        new Date(),
        new Date()
      );

      vi.mocked(mockSheetMarkerRepository.findById).mockResolvedValue(marker);
      vi.mocked(mockSheetMarkerCommentRepository.findById).mockResolvedValue(parentReply);

      const input = new CreateSheetMarkerCommentInput('Reply to reply', 'parent-reply-id');

      await expect(
        createSheetMarkerComment.execute(markerId, userId, input)
      ).rejects.toThrow('Cannot reply to a reply');
    });

    it('should throw error if parent comment belongs to different marker', async () => {
      const marker = SheetMarker.reconstruct(
        markerId,
        sheetId,
        null,
        'number',
        10,
        20,
        null,
        null,
        null,
        new Date(),
        new Date()
      );

      const parentComment = SheetMarkerComment.reconstruct(
        'parent-comment-id',
        'different-marker-id',
        userId,
        null,
        'Parent comment',
        new Date(),
        new Date()
      );

      vi.mocked(mockSheetMarkerRepository.findById).mockResolvedValue(marker);
      vi.mocked(mockSheetMarkerCommentRepository.findById).mockResolvedValue(parentComment);

      const input = new CreateSheetMarkerCommentInput('Reply comment', 'parent-comment-id');

      await expect(
        createSheetMarkerComment.execute(markerId, userId, input)
      ).rejects.toThrow('Parent comment does not belong to this marker');
    });

    it('should throw error if user not found', async () => {
      const marker = SheetMarker.reconstruct(
        markerId,
        sheetId,
        null,
        'number',
        10,
        20,
        null,
        null,
        null,
        new Date(),
        new Date()
      );

      vi.mocked(mockSheetMarkerRepository.findById).mockResolvedValue(marker);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const input = new CreateSheetMarkerCommentInput('Test comment', null);

      await expect(
        createSheetMarkerComment.execute(markerId, userId, input)
      ).rejects.toThrow('User not found');
    });
  });
});

