import { IProjectRepository } from '../../../domain/project/model/IProjectRepository';
import { Project } from '../../../domain/project/model/Project';
import { ProjectVisibility } from '../../../domain/project/model/ProjectVisibility';
import { CreateProjectInput } from '../dto/CreateProjectInput';
import { ProjectOutput } from '../dto/ProjectOutput';
import { v4 as uuidv4 } from 'uuid';

export class CreateProject {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<ProjectOutput> {
    const project = Project.create(
      uuidv4(),
      input.name,
      input.description || null,
      input.visibility || ProjectVisibility.PRIVATE,
      input.companyIds || []
    );

    const savedProject = await this.projectRepository.save(project);

    return new ProjectOutput(
      savedProject.id,
      savedProject.name,
      savedProject.description,
      savedProject.visibility.toString(),
      savedProject.companyIds,
      savedProject.createdAt,
      savedProject.updatedAt
    );
  }
}



