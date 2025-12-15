import { IProjectRepository } from '../../../domain/project/model/IProjectRepository';
import { ProjectOutput } from '../dto/ProjectOutput';

export class ListProjects {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(): Promise<ProjectOutput[]> {
    const projects = await this.projectRepository.findAll();

    return projects.map(
      (project) =>
        new ProjectOutput(
          project.id,
          project.name,
          project.description,
          project.createdAt,
          project.updatedAt
        )
    );
  }
}



