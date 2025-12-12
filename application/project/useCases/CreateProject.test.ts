import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateProject } from './CreateProject';
import { IProjectRepository } from '../../../domain/project/model/IProjectRepository';
import { CreateProjectInput } from '../dto/CreateProjectInput';
import { Project } from '../../../domain/project/model/Project';

describe('CreateProject', () => {
  let createProject: CreateProject;
  let mockProjectRepository: IProjectRepository;

  const projectName = 'Test Project';
  const projectDescription = 'Test Description';

  beforeEach(() => {
    mockProjectRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    createProject = new CreateProject(mockProjectRepository);
  });

  describe('execute', () => {
    it('should create a new project and return ProjectOutput', async () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-01');
      const savedProject = Project.reconstruct(
        'generated-id',
        projectName,
        projectDescription,
        createdAt,
        updatedAt
      );

      vi.mocked(mockProjectRepository.save).mockResolvedValue(savedProject);

      const input = new CreateProjectInput(projectName, projectDescription);
      const result = await createProject.execute(input);

      expect(result).toBeDefined();
      expect(result.id).toBe('generated-id');
      expect(result.name).toBe(projectName);
      expect(result.description).toBe(projectDescription);
      expect(result.createdAt).toEqual(createdAt);
      expect(result.updatedAt).toEqual(updatedAt);

      expect(mockProjectRepository.save).toHaveBeenCalled();
      const savedProjectArg = vi.mocked(mockProjectRepository.save).mock.calls[0][0];
      expect(savedProjectArg).toBeInstanceOf(Project);
      expect(savedProjectArg.name).toBe(projectName);
      expect(savedProjectArg.description).toBe(projectDescription);
    });

    it('should create a project with null description when not provided', async () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-01');
      const savedProject = Project.reconstruct(
        'generated-id',
        projectName,
        null,
        createdAt,
        updatedAt
      );

      vi.mocked(mockProjectRepository.save).mockResolvedValue(savedProject);

      const input = new CreateProjectInput(projectName);
      const result = await createProject.execute(input);

      expect(result).toBeDefined();
      expect(result.name).toBe(projectName);
      expect(result.description).toBeNull();

      expect(mockProjectRepository.save).toHaveBeenCalled();
      const savedProjectArg = vi.mocked(mockProjectRepository.save).mock.calls[0][0];
      expect(savedProjectArg.description).toBeNull();
    });
  });
});

