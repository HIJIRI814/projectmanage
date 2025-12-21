import { describe, it, expect } from 'vitest';
import { SheetMarkerComment } from './SheetMarkerComment';

describe('SheetMarkerComment', () => {
  describe('create', () => {
    it('should create a new comment with all fields', () => {
      const id = 'comment-id';
      const markerId = 'marker-id';
      const userId = 'user-id';
      const parentCommentId = null;
      const content = 'Test comment';

      const comment = SheetMarkerComment.create(id, markerId, userId, parentCommentId, content);

      expect(comment.id).toBe(id);
      expect(comment.markerId).toBe(markerId);
      expect(comment.userId).toBe(userId);
      expect(comment.parentCommentId).toBeNull();
      expect(comment.content).toBe(content);
      expect(comment.createdAt).toBeInstanceOf(Date);
      expect(comment.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a reply comment with parentCommentId', () => {
      const id = 'reply-id';
      const markerId = 'marker-id';
      const userId = 'user-id';
      const parentCommentId = 'parent-comment-id';
      const content = 'Test reply';

      const comment = SheetMarkerComment.create(id, markerId, userId, parentCommentId, content);

      expect(comment.id).toBe(id);
      expect(comment.markerId).toBe(markerId);
      expect(comment.userId).toBe(userId);
      expect(comment.parentCommentId).toBe(parentCommentId);
      expect(comment.content).toBe(content);
      expect(comment.createdAt).toBeInstanceOf(Date);
      expect(comment.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct a comment with all fields', () => {
      const id = 'comment-id';
      const markerId = 'marker-id';
      const userId = 'user-id';
      const parentCommentId = null;
      const content = 'Test comment';
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const comment = SheetMarkerComment.reconstruct(
        id,
        markerId,
        userId,
        parentCommentId,
        content,
        createdAt,
        updatedAt
      );

      expect(comment.id).toBe(id);
      expect(comment.markerId).toBe(markerId);
      expect(comment.userId).toBe(userId);
      expect(comment.parentCommentId).toBeNull();
      expect(comment.content).toBe(content);
      expect(comment.createdAt).toEqual(createdAt);
      expect(comment.updatedAt).toEqual(updatedAt);
    });

    it('should reconstruct a reply comment with parentCommentId', () => {
      const id = 'reply-id';
      const markerId = 'marker-id';
      const userId = 'user-id';
      const parentCommentId = 'parent-comment-id';
      const content = 'Test reply';
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const comment = SheetMarkerComment.reconstruct(
        id,
        markerId,
        userId,
        parentCommentId,
        content,
        createdAt,
        updatedAt
      );

      expect(comment.id).toBe(id);
      expect(comment.markerId).toBe(markerId);
      expect(comment.userId).toBe(userId);
      expect(comment.parentCommentId).toBe(parentCommentId);
      expect(comment.content).toBe(content);
      expect(comment.createdAt).toEqual(createdAt);
      expect(comment.updatedAt).toEqual(updatedAt);
    });
  });
});

