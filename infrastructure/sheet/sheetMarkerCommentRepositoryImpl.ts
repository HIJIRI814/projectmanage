import { ISheetMarkerCommentRepository } from '~domain/sheet/model/ISheetMarkerCommentRepository';
import { SheetMarkerComment } from '~domain/sheet/model/SheetMarkerComment';
import { prismaClient } from '../prisma/prismaClient';

export class SheetMarkerCommentRepositoryImpl implements ISheetMarkerCommentRepository {
  async findById(id: string): Promise<SheetMarkerComment | null> {
    const commentData = await prismaClient.sheetMarkerComment.findUnique({
      where: { id },
    });

    if (!commentData) {
      return null;
    }

    return SheetMarkerComment.reconstruct(
      commentData.id,
      commentData.markerId,
      commentData.userId,
      commentData.parentCommentId,
      commentData.content,
      commentData.createdAt,
      commentData.updatedAt
    );
  }

  async findByMarkerId(markerId: string): Promise<SheetMarkerComment[]> {
    const commentsData = await prismaClient.sheetMarkerComment.findMany({
      where: { markerId },
      orderBy: { createdAt: 'asc' },
    });

    return commentsData.map((commentData) =>
      SheetMarkerComment.reconstruct(
        commentData.id,
        commentData.markerId,
        commentData.userId,
        commentData.parentCommentId,
        commentData.content,
        commentData.createdAt,
        commentData.updatedAt
      )
    );
  }

  async save(comment: SheetMarkerComment): Promise<SheetMarkerComment> {
    const commentData = await prismaClient.sheetMarkerComment.create({
      data: {
        id: comment.id,
        markerId: comment.markerId,
        userId: comment.userId,
        parentCommentId: comment.parentCommentId,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      },
    });

    return SheetMarkerComment.reconstruct(
      commentData.id,
      commentData.markerId,
      commentData.userId,
      commentData.parentCommentId,
      commentData.content,
      commentData.createdAt,
      commentData.updatedAt
    );
  }
}

