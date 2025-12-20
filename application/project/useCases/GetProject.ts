import { IProjectRepository } from '~domain/project/model/IProjectRepository';
import { ProjectOutput } from '../dto/ProjectOutput';

export class GetProject {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(projectId: string): Promise<ProjectOutput | null> {
    const project = await this.projectRepository.findById(projectId);

    if (!project) {
      return null;
    }

    return new ProjectOutput(
      project.id,
      project.name,
      project.description,
      project.visibility.toString(),
      project.companyIds,
      project.clientCompanyIds,
      project.createdAt,
      project.updatedAt
    );
  }
}

