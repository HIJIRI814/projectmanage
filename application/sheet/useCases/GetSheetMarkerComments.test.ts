import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetSheetMarkerComments } from './GetSheetMarkerComments';
import { ISheetMarkerCommentRepository } from '~domain/sheet/model/ISheetMarkerCommentRepository';
import { IUserRepository } from '~domain/user/model/IUserRepository';
import { SheetMarkerComment } from '~domain/sheet/model/SheetMarkerComment';
import { User } from '~domain/user/model/User';

describe('GetSheetMarkerComments', () => {
  let getSheetMarkerComments: GetSheetMarkerComments;
  let mockSheetMarkerCommentRepository: ISheetMarkerCommentRepository;
  let mockUserRepository: IUserRepository;

  const markerId = 'marker-id';
  const userId1 = 'user-id-1';
  const userId2 = 'user-id-2';

  beforeEach(() => {
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

    getSheetMarkerComments = new GetSheetMarkerComments(
      mockSheetMarkerCommentRepository,
      mockUserRepository
    );
  });

  describe('execute', () => {
    it('should return empty array if no comments found', async () => {
      vi.mocked(mockSheetMarkerCommentRepository.findByMarkerId).mockResolvedValue([]);

      const result = await getSheetMarkerComments.execute(markerId);

      expect(result).toEqual([]);
      expect(mockSheetMarkerCommentRepository.findByMarkerId).toHaveBeenCalledWith(markerId);
    });

    it('should return top-level comments only', async () => {
      const comment1 = SheetMarkerComment.reconstruct(
        'comment-1',
        markerId,
        userId1,
        null,
        'Comment 1',
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );
      const comment2 = SheetMarkerComment.reconstruct(
        'comment-2',
        markerId,
        userId2,
        null,
        'Comment 2',
        new Date('2024-01-02'),
        new Date('2024-01-02')
      );

      const user1 = User.reconstruct(
        userId1,
        'user1@example.com',
        'hashed-password',
        'User 1',
        new Date(),
        new Date()
      );
      const user2 = User.reconstruct(
        userId2,
        'user2@example.com',
        'hashed-password',
        'User 2',
        new Date(),
        new Date()
      );

      vi.mocked(mockSheetMarkerCommentRepository.findByMarkerId).mockResolvedValue([
        comment1,
        comment2,
      ]);
      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2);

      const result = await getSheetMarkerComments.execute(markerId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('comment-1');
      expect(result[0].userName).toBe('User 1');
      expect(result[1].id).toBe('comment-2');
      expect(result[1].userName).toBe('User 2');
      expect(result[0].replies).toEqual([]);
      expect(result[1].replies).toEqual([]);
    });

    it('should return comments with replies in hierarchical structure', async () => {
      const parentComment = SheetMarkerComment.reconstruct(
        'parent-id',
        markerId,
        userId1,
        null,
        'Parent comment',
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );
      const reply1 = SheetMarkerComment.reconstruct(
        'reply-1',
        markerId,
        userId2,
        'parent-id',
        'Reply 1',
        new Date('2024-01-02'),
        new Date('2024-01-02')
      );
      const reply2 = SheetMarkerComment.reconstruct(
        'reply-2',
        markerId,
        userId1,
        'parent-id',
        'Reply 2',
        new Date('2024-01-03'),
        new Date('2024-01-03')
      );

      const user1 = User.reconstruct(
        userId1,
        'user1@example.com',
        'hashed-password',
        'User 1',
        new Date(),
        new Date()
      );
      const user2 = User.reconstruct(
        userId2,
        'user2@example.com',
        'hashed-password',
        'User 2',
        new Date(),
        new Date()
      );

      vi.mocked(mockSheetMarkerCommentRepository.findByMarkerId).mockResolvedValue([
        parentComment,
        reply1,
        reply2,
      ]);
      vi.mocked(mockUserRepository.findById)
        .mockResolvedValueOnce(user1)
        .mockResolvedValueOnce(user2)
        .mockResolvedValueOnce(user1);

      const result = await getSheetMarkerComments.execute(markerId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('parent-id');
      expect(result[0].replies).toHaveLength(2);
      expect(result[0].replies[0].id).toBe('reply-1');
      expect(result[0].replies[1].id).toBe('reply-2');
    });

    it('should handle unknown user name', async () => {
      const comment = SheetMarkerComment.reconstruct(
        'comment-1',
        markerId,
        userId1,
        null,
        'Comment 1',
        new Date('2024-01-01'),
        new Date('2024-01-01')
      );

      vi.mocked(mockSheetMarkerCommentRepository.findByMarkerId).mockResolvedValue([comment]);
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const result = await getSheetMarkerComments.execute(markerId);

      expect(result).toHaveLength(1);
      expect(result[0].userName).toBe('Unknown User');
    });
  });
});

