export class CreateSheetInput {
  constructor(
    public readonly name: string,
    public readonly description?: string,
    public readonly content?: string
  ) {}
}

