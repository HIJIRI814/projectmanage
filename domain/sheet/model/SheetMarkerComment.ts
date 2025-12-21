export class SheetMarkerComment {
  private constructor(
    public readonly id: string,
    public readonly markerId: string,
    public readonly userId: string,
    public readonly parentCommentId: string | null,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    markerId: string,
    userId: string,
    parentCommentId: string | null,
    content: string
  ): SheetMarkerComment {
    const now = new Date();
    return new SheetMarkerComment(
      id,
      markerId,
      userId,
      parentCommentId,
      content,
      now,
      now
    );
  }

  static reconstruct(
    id: string,
    markerId: string,
    userId: string,
    parentCommentId: string | null,
    content: string,
    createdAt: Date,
    updatedAt: Date
  ): SheetMarkerComment {
    return new SheetMarkerComment(
      id,
      markerId,
      userId,
      parentCommentId,
      content,
      createdAt,
      updatedAt
    );
  }
}

