export class Company {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(id: string, name: string): Company {
    const now = new Date();
    return new Company(id, name, now, now);
  }

  static reconstruct(
    id: string,
    name: string,
    createdAt: Date,
    updatedAt: Date
  ): Company {
    return new Company(id, name, createdAt, updatedAt);
  }
}

