export class Sheet {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly content: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    projectId: string,
    name: string,
    description: string | null = null,
    content: string | null = null
  ): Sheet {
    const now = new Date();
    return new Sheet(id, projectId, name, description, content, now, now);
  }

  static reconstruct(
    id: string,
    projectId: string,
    name: string,
    description: string | null,
    content: string | null,
    createdAt: Date,
    updatedAt: Date
  ): Sheet {
    return new Sheet(id, projectId, name, description, content, createdAt, updatedAt);
  }
}

