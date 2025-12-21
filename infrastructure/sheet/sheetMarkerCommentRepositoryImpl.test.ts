import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SheetMarkerCommentRepositoryImpl } from './sheetMarkerCommentRepositoryImpl';
import { SheetMarkerComment } from '~domain/sheet/model/SheetMarkerComment';
import { prismaClient } from '../prisma/prismaClient';
import { v4 as uuidv4 } from 'uuid';

describe('SheetMarkerCommentRepositoryImpl', () => {
  let repository: SheetMarkerCommentRepositoryImpl;
  let markerId: string;
  let userId: string;
  let projectId: string;
  let sheetId: string;

  beforeEach(async () => {
    repository = new SheetMarkerCommentRepositoryImpl();
    
    // テスト用のプロジェクト、シート、マーカー、ユーザーを作成
    const projectIdValue = uuidv4();
    const project = await prismaClient.project.create({
      data: {
        id: projectIdValue,
        name: 'Test Project',
        description: 'Test Description',
      },
    });
    projectId = project.id;

    const sheetIdValue = uuidv4();
    const sheet = await prismaClient.sheet.create({
      data: {
        id: sheetIdValue,
        projectId: project.id,
        name: 'Test Sheet',
      },
    });
    sheetId = sheet.id;

    const markerIdValue = uuidv4();
    const marker = await prismaClient.sheetMarker.create({
      data: {
        id: markerIdValue,
        sheetId: sheet.id,
        type: 'number',
        x: 10,
        y: 20,
      },
    });
    markerId = marker.id;

    const userIdValue = uuidv4();
    const user = await prismaClient.user.create({
      data: {
        id: userIdValue,
        email: `test-${userIdValue}@example.com`,
        passwordHash: 'hashed-password',
        name: 'Test User',
      },
    });
    userId = user.id;
  });

  afterEach(async () => {
    await prismaClient.sheetMarkerComment.deleteMany({
      where: { markerId },
    });
    await prismaClient.sheetMarker.deleteMany({
      where: { id: markerId },
    });
    await prismaClient.sheet.deleteMany({
      where: { id: sheetId },
    });
    await prismaClient.project.deleteMany({
      where: { id: projectId },
    });
    await prismaClient.user.deleteMany({
      where: { id: userId },
    });
  });

  describe('save', () => {
    it('should create a new comment', async () => {
      const commentId = uuidv4();
      const comment = SheetMarkerComment.create(
        commentId,
        markerId,
        userId,
        null,
        'Test comment'
      );

      const savedComment = await repository.save(comment);

      expect(savedComment.id).toBe(commentId);
      expect(savedComment.markerId).toBe(markerId);
      expect(savedComment.userId).toBe(userId);
      expect(savedComment.parentCommentId).toBeNull();
      expect(savedComment.content).toBe('Test comment');
      expect(savedComment.createdAt).toBeInstanceOf(Date);
      expect(savedComment.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a reply comment', async () => {
      const parentCommentId = uuidv4();
      const parentComment = SheetMarkerComment.create(
        parentCommentId,
        markerId,
        userId,
        null,
        'Parent comment'
      );
      await repository.save(parentComment);

      const replyId = uuidv4();
      const reply = SheetMarkerComment.create(
        replyId,
        markerId,
        userId,
        parentCommentId,
        'Reply comment'
      );

      const savedReply = await repository.save(reply);

      expect(savedReply.id).toBe(replyId);
      expect(savedReply.markerId).toBe(markerId);
      expect(savedReply.userId).toBe(userId);
      expect(savedReply.parentCommentId).toBe(parentCommentId);
      expect(savedReply.content).toBe('Reply comment');
    });
  });

  describe('findById', () => {
    it('should find a comment by id', async () => {
      const commentId = uuidv4();
      const comment = SheetMarkerComment.create(
        commentId,
        markerId,
        userId,
        null,
        'Test comment'
      );
      await repository.save(comment);

      const found = await repository.findById(commentId);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(commentId);
      expect(found?.content).toBe('Test comment');
    });

    it('should return null if comment not found', async () => {
      const found = await repository.findById(uuidv4());
      expect(found).toBeNull();
    });
  });

  describe('findByMarkerId', () => {
    it('should find all comments for a marker', async () => {
      const comment1Id = uuidv4();
      const comment2Id = uuidv4();
      const comment1 = SheetMarkerComment.create(
        comment1Id,
        markerId,
        userId,
        null,
        'Comment 1'
      );
      const comment2 = SheetMarkerComment.create(
        comment2Id,
        markerId,
        userId,
        null,
        'Comment 2'
      );
      await repository.save(comment1);
      await repository.save(comment2);

      const comments = await repository.findByMarkerId(markerId);

      expect(comments).toHaveLength(2);
      expect(comments.map(c => c.id)).toContain(comment1Id);
      expect(comments.map(c => c.id)).toContain(comment2Id);
    });

    it('should return empty array if no comments found', async () => {
      const comments = await repository.findByMarkerId(markerId);
      expect(comments).toHaveLength(0);
    });

    it('should find comments and replies for a marker', async () => {
      const parentId = uuidv4();
      const parentComment = SheetMarkerComment.create(
        parentId,
        markerId,
        userId,
        null,
        'Parent'
      );
      await repository.save(parentComment);

      const reply1Id = uuidv4();
      const reply2Id = uuidv4();
      const reply1 = SheetMarkerComment.create(
        reply1Id,
        markerId,
        userId,
        parentId,
        'Reply 1'
      );
      const reply2 = SheetMarkerComment.create(
        reply2Id,
        markerId,
        userId,
        parentId,
        'Reply 2'
      );
      await repository.save(reply1);
      await repository.save(reply2);

      const comments = await repository.findByMarkerId(markerId);

      expect(comments).toHaveLength(3);
      const parent = comments.find(c => c.id === parentId);
      const replies = comments.filter(c => c.parentCommentId === parentId);
      expect(parent).not.toBeUndefined();
      expect(replies).toHaveLength(2);
    });
  });
});

