export class SheetMarkerOutput {
  constructor(
    public readonly id: string,
    public readonly sheetId: string,
    public readonly sheetVersionId: string | null,
    public readonly type: 'number' | 'square',
    public readonly x: number,
    public readonly y: number,
    public readonly width: number | null,
    public readonly height: number | null,
    public readonly note: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}

