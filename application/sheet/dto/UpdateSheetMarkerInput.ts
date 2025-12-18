export class UpdateSheetMarkerInput {
  constructor(
    public readonly x: number | null = null,
    public readonly y: number | null = null,
    public readonly width: number | null = null,
    public readonly height: number | null = null,
    public readonly note: string | null = null
  ) {}
}

