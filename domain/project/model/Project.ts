import { ProjectVisibility, ProjectVisibilityValue } from './ProjectVisibility';

export class Project {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly visibility: ProjectVisibilityValue,
    public readonly companyIds: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    name: string,
    description: string | null = null,
    visibility: ProjectVisibility = ProjectVisibility.PRIVATE,
    companyIds: string[] = []
  ): Project {
    const now = new Date();
    return new Project(
      id,
      name,
      description,
      new ProjectVisibilityValue(visibility),
      companyIds,
      now,
      now
    );
  }

  static reconstruct(
    id: string,
    name: string,
    description: string | null,
    visibility: string,
    companyIds: string[],
    createdAt: Date,
    updatedAt: Date
  ): Project {
    return new Project(
      id,
      name,
      description,
      ProjectVisibilityValue.fromString(visibility),
      companyIds,
      createdAt,
      updatedAt
    );
  }
}



