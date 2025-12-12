export class CreateProjectInput {
  constructor(
    public readonly name: string,
    public readonly description?: string
  ) {}
}

