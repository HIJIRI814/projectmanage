export class SheetVersionOutput {
  constructor(
    public readonly id: string,
    public readonly sheetId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly content: string | null,
    public readonly versionName: string,
    public readonly createdAt: Date
  ) {}
}

