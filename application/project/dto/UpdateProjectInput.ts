import { ProjectVisibility } from '../../../domain/project/model/ProjectVisibility';

export class UpdateProjectInput {
  constructor(
    public readonly name?: string,
    public readonly description?: string,
    public readonly visibility?: ProjectVisibility,
    public readonly companyIds?: string[],
    public readonly clientCompanyIds?: string[]
  ) {}
}



