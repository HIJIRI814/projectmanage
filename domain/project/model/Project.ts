export class Project {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    name: string,
    description: string | null = null
  ): Project {
    const now = new Date();
    return new Project(id, name, description, now, now);
  }

  static reconstruct(
    id: string,
    name: string,
    description: string | null,
    createdAt: Date,
    updatedAt: Date
  ): Project {
    return new Project(id, name, description, createdAt, updatedAt);
  }
}



