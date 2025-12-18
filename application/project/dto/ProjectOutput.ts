export class ProjectOutput {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly visibility: string,
    public readonly companyIds: string[],
    public readonly clientCompanyIds: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}



