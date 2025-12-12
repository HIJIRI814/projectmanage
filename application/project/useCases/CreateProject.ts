import { IProjectRepository } from '../../../domain/project/model/IProjectRepository';
import { Project } from '../../../domain/project/model/Project';
import { CreateProjectInput } from '../dto/CreateProjectInput';
import { ProjectOutput } from '../dto/ProjectOutput';
import { v4 as uuidv4 } from 'uuid';

export class CreateProject {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<ProjectOutput> {
    const project = Project.create(
      uuidv4(),
      input.name,
      input.description || null
    );

    const savedProject = await this.projectRepository.save(project);

    return new ProjectOutput(
      savedProject.id,
      savedProject.name,
      savedProject.description,
      savedProject.createdAt,
      savedProject.updatedAt
    );
  }
}

