import { ISheetMarkerCommentRepository } from '~domain/sheet/model/ISheetMarkerCommentRepository';
import { IUserRepository } from '~domain/user/model/IUserRepository';
import { SheetMarkerCommentOutput } from '../dto/SheetMarkerCommentOutput';

export class GetSheetMarkerComments {
  constructor(
    private sheetMarkerCommentRepository: ISheetMarkerCommentRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(markerId: string): Promise<SheetMarkerCommentOutput[]> {
    const comments = await this.sheetMarkerCommentRepository.findByMarkerId(markerId);

    const commentMap = new Map<string, SheetMarkerCommentOutput>();
    const topLevelComments: SheetMarkerCommentOutput[] = [];

    for (const comment of comments) {
      const user = await this.userRepository.findById(comment.userId);
      const userName = user?.name || 'Unknown User';

      const commentOutput = new SheetMarkerCommentOutput(
        comment.id,
        comment.markerId,
        comment.userId,
        userName,
        comment.parentCommentId,
        comment.content,
        comment.createdAt,
        comment.updatedAt,
        []
      );

      commentMap.set(comment.id, commentOutput);
    }

    for (const comment of comments) {
      const commentOutput = commentMap.get(comment.id);
      if (!commentOutput) continue;

      if (comment.parentCommentId === null) {
        topLevelComments.push(commentOutput);
      } else {
        const parentComment = commentMap.get(comment.parentCommentId);
        if (parentComment) {
          parentComment.replies.push(commentOutput);
        }
      }
    }

    return topLevelComments;
  }
}

