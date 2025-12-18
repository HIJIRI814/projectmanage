export class CreateSheetMarkerInput {
  constructor(
    public readonly type: 'number' | 'square',
    public readonly x: number,
    public readonly y: number,
    public readonly width: number | null = null,
    public readonly height: number | null = null,
    public readonly note: string | null = null
  ) {}
}

