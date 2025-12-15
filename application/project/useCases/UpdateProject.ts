import { IProjectRepository } from '../../../domain/project/model/IProjectRepository';
import { Project } from '../../../domain/project/model/Project';
import { ProjectVisibility } from '../../../domain/project/model/ProjectVisibility';
import { UpdateProjectInput } from '../dto/UpdateProjectInput';
import { ProjectOutput } from '../dto/ProjectOutput';

export class UpdateProject {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(projectId: string, input: UpdateProjectInput): Promise<ProjectOutput> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const updatedProject = Project.reconstruct(
      project.id,
      input.name || project.name,
      input.description !== undefined ? input.description : project.description,
      input.visibility ? input.visibility : project.visibility.toString(),
      input.companyIds !== undefined ? input.companyIds : project.companyIds,
      project.createdAt,
      new Date()
    );

    const savedProject = await this.projectRepository.save(updatedProject);

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



