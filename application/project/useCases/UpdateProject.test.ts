import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UpdateProject } from './UpdateProject';
import { IProjectRepository } from '~domain/project/model/IProjectRepository';
import { UpdateProjectInput } from '../dto/UpdateProjectInput';
import { Project } from '~domain/project/model/Project';
import { ProjectVisibility } from '~domain/project/model/ProjectVisibility';

describe('UpdateProject', () => {
  let updateProject: UpdateProject;
  let mockProjectRepository: IProjectRepository;

  const projectId = 'test-project-id';
  const originalName = 'Original Project';
  const originalDescription = 'Original Description';
  const updatedName = 'Updated Project';
  const updatedDescription = 'Updated Description';

  beforeEach(() => {
    mockProjectRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    updateProject = new UpdateProject(mockProjectRepository);
  });

  describe('execute', () => {
    it('should update project name and description', async () => {
      const createdAt = new Date('2024-01-01');
      const originalUpdatedAt = new Date('2024-01-01');
      const updatedUpdatedAt = new Date('2024-01-02');

      const existingProject = Project.reconstruct(
        projectId,
        originalName,
        originalDescription,
        ProjectVisibility.PRIVATE,
        [],
        [],
        createdAt,
        originalUpdatedAt
      );

      const savedProject = Project.reconstruct(
        projectId,
        updatedName,
        updatedDescription,
        ProjectVisibility.PRIVATE,
        [],
        [],
        createdAt,
        updatedUpdatedAt
      );

      vi.mocked(mockProjectRepository.findById).mockResolvedValue(existingProject);
      vi.mocked(mockProjectRepository.save).mockResolvedValue(savedProject);

      const input = new UpdateProjectInput(updatedName, updatedDescription);
      const result = await updateProject.execute(projectId, input);

      expect(result).toBeDefined();
      expect(result.id).toBe(projectId);
      expect(result.name).toBe(updatedName);
      expect(result.description).toBe(updatedDescription);
      expect(result.createdAt).toEqual(createdAt);
      expect(result.updatedAt).toEqual(updatedUpdatedAt);

      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
      expect(mockProjectRepository.save).toHaveBeenCalled();
    });

    it('should update only name when description is not provided', async () => {
      const createdAt = new Date('2024-01-01');
      const originalUpdatedAt = new Date('2024-01-01');
      const updatedUpdatedAt = new Date('2024-01-02');

      const existingProject = Project.reconstruct(
        projectId,
        originalName,
        originalDescription,
        ProjectVisibility.PRIVATE,
        [],
        [],
        createdAt,
        originalUpdatedAt
      );

      const savedProject = Project.reconstruct(
        projectId,
        updatedName,
        originalDescription,
        ProjectVisibility.PRIVATE,
        [],
        [],
        createdAt,
        updatedUpdatedAt
      );

      vi.mocked(mockProjectRepository.findById).mockResolvedValue(existingProject);
      vi.mocked(mockProjectRepository.save).mockResolvedValue(savedProject);

      const input = new UpdateProjectInput(updatedName);
      const result = await updateProject.execute(projectId, input);

      expect(result.name).toBe(updatedName);
      expect(result.description).toBe(originalDescription);
    });

    it('should update only description when name is not provided', async () => {
      const createdAt = new Date('2024-01-01');
      const originalUpdatedAt = new Date('2024-01-01');
      const updatedUpdatedAt = new Date('2024-01-02');

      const existingProject = Project.reconstruct(
        projectId,
        originalName,
        originalDescription,
        ProjectVisibility.PRIVATE,
        [],
        [],
        createdAt,
        originalUpdatedAt
      );

      const savedProject = Project.reconstruct(
        projectId,
        originalName,
        updatedDescription,
        ProjectVisibility.PRIVATE,
        [],
        [],
        createdAt,
        updatedUpdatedAt
      );

      vi.mocked(mockProjectRepository.findById).mockResolvedValue(existingProject);
      vi.mocked(mockProjectRepository.save).mockResolvedValue(savedProject);

      const input = new UpdateProjectInput(undefined, updatedDescription);
      const result = await updateProject.execute(projectId, input);

      expect(result.name).toBe(originalName);
      expect(result.description).toBe(updatedDescription);
    });

    it('should throw an error when project does not exist', async () => {
      vi.mocked(mockProjectRepository.findById).mockResolvedValue(null);

      const input = new UpdateProjectInput(updatedName, updatedDescription);

      await expect(updateProject.execute(projectId, input)).rejects.toThrow(
        'Project not found'
      );

      expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
      expect(mockProjectRepository.save).not.toHaveBeenCalled();
    });

    it('should handle null description update', async () => {
      const createdAt = new Date('2024-01-01');
      const originalUpdatedAt = new Date('2024-01-01');
      const updatedUpdatedAt = new Date('2024-01-02');

      const existingProject = Project.reconstruct(
        projectId,
        originalName,
        originalDescription,
        ProjectVisibility.PRIVATE,
        [],
        [],
        createdAt,
        originalUpdatedAt
      );

      const savedProject = Project.reconstruct(
        projectId,
        originalName,
        null,
        ProjectVisibility.PRIVATE,
        [],
        [],
        createdAt,
        updatedUpdatedAt
      );

      vi.mocked(mockProjectRepository.findById).mockResolvedValue(existingProject);
      vi.mocked(mockProjectRepository.save).mockResolvedValue(savedProject);

      const input = new UpdateProjectInput(undefined, null);
      const result = await updateProject.execute(projectId, input);

      expect(result.description).toBeNull();
    });
  });
});



