export class SheetMarkerCommentOutput {
  constructor(
    public readonly id: string,
    public readonly markerId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly parentCommentId: string | null,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public replies: SheetMarkerCommentOutput[] = []
  ) {}
}

