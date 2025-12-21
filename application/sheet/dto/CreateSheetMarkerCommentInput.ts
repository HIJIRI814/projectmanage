export class CreateSheetMarkerCommentInput {
  constructor(
    public readonly content: string,
    public readonly parentCommentId: string | null = null
  ) {}
}

