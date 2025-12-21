import { ISheetMarkerRepository } from '~domain/sheet/model/ISheetMarkerRepository';
import { ISheetMarkerCommentRepository } from '~domain/sheet/model/ISheetMarkerCommentRepository';
import { IUserRepository } from '~domain/user/model/IUserRepository';
import { SheetMarkerComment } from '~domain/sheet/model/SheetMarkerComment';
import { CreateSheetMarkerCommentInput } from '../dto/CreateSheetMarkerCommentInput';
import { SheetMarkerCommentOutput } from '../dto/SheetMarkerCommentOutput';
import { v4 as uuidv4 } from 'uuid';

export class CreateSheetMarkerComment {
  constructor(
    private sheetMarkerRepository: ISheetMarkerRepository,
    private sheetMarkerCommentRepository: ISheetMarkerCommentRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(markerId: string, userId: string, input: CreateSheetMarkerCommentInput): Promise<SheetMarkerCommentOutput> {
    const marker = await this.sheetMarkerRepository.findById(markerId);
    if (!marker) {
      throw new Error('Marker not found');
    }

    if (input.parentCommentId) {
      const parentComment = await this.sheetMarkerCommentRepository.findById(input.parentCommentId);
      if (!parentComment) {
        throw new Error('Parent comment not found');
      }
      if (parentComment.parentCommentId !== null) {
        throw new Error('Cannot reply to a reply');
      }
      if (parentComment.markerId !== markerId) {
        throw new Error('Parent comment does not belong to this marker');
      }
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const comment = SheetMarkerComment.create(
      uuidv4(),
      markerId,
      userId,
      input.parentCommentId,
      input.content
    );

    const savedComment = await this.sheetMarkerCommentRepository.save(comment);

    return new SheetMarkerCommentOutput(
      savedComment.id,
      savedComment.markerId,
      savedComment.userId,
      user.name,
      savedComment.parentCommentId,
      savedComment.content,
      savedComment.createdAt,
      savedComment.updatedAt,
      []
    );
  }
}

