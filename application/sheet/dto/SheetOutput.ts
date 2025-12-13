export class SheetOutput {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly content: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}

