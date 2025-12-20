import { IProjectRepository } from '~domain/project/model/IProjectRepository';

export class DeleteProject {
  constructor(private projectRepository: IProjectRepository) {}

  async execute(projectId: string): Promise<void> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    await this.projectRepository.delete(projectId);
  }
}



