import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeleteProject } from './DeleteProject';
import { IProjectRepository } from '../../../domain/project/model/IProjectRepository';
import { Project } from '../../../domain/project/model/Project';

describe('DeleteProject', () => {
  let deleteProject: DeleteProject;
  let mockProjectRepository: IProjectRepository;

  const projectId = 'test-project-id';
  const projectName = 'Test Project';
  const projectDescription = 'Test Description';

  beforeEach(() => {
    mockProjectRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    deleteProject = new DeleteProject(mockProjectRepository);
  });

  describe('execute', () => {
    it('should delete a project when it exists', async () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-01');

      const existingProject = Project.reconstruct(
        projectId,
        projectName,
        projectDescription,
        createdAt,
        updatedAt
      );

      vi.mocked(mockProjectRepository.findById).mockResolvedValue(existingProject);
      vi.mocked(mockProjectRepository.delete).mockResolvedValue(undefined);

      await deleteProject.execute(projectId);

      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
      expect(mockProjectRepository.delete).toHaveBeenCalledWith(projectId);
    });

    it('should throw an error when project does not exist', async () => {
      vi.mocked(mockProjectRepository.findById).mockResolvedValue(null);

      await expect(deleteProject.execute(projectId)).rejects.toThrow(
        'Project not found'
      );

      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
      expect(mockProjectRepository.delete).not.toHaveBeenCalled();
    });
  });
});

