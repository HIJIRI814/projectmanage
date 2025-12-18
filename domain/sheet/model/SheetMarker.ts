export type MarkerType = 'number' | 'square';

export class SheetMarker {
  private constructor(
    public readonly id: string,
    public readonly sheetId: string,
    public readonly sheetVersionId: string | null,
    public readonly type: MarkerType,
    public readonly x: number,
    public readonly y: number,
    public readonly width: number | null,
    public readonly height: number | null,
    public readonly note: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    sheetId: string,
    sheetVersionId: string | null,
    type: MarkerType,
    x: number,
    y: number,
    width: number | null = null,
    height: number | null = null,
    note: string | null = null
  ): SheetMarker {
    const now = new Date();
    return new SheetMarker(
      id,
      sheetId,
      sheetVersionId,
      type,
      x,
      y,
      width,
      height,
      note,
      now,
      now
    );
  }

  static reconstruct(
    id: string,
    sheetId: string,
    sheetVersionId: string | null,
    type: MarkerType,
    x: number,
    y: number,
    width: number | null,
    height: number | null,
    note: string | null,
    createdAt: Date,
    updatedAt: Date
  ): SheetMarker {
    return new SheetMarker(
      id,
      sheetId,
      sheetVersionId,
      type,
      x,
      y,
      width,
      height,
      note,
      createdAt,
      updatedAt
    );
  }
}

