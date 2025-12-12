import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListProjects } from './ListProjects';
import { IProjectRepository } from '../../../domain/project/model/IProjectRepository';
import { Project } from '../../../domain/project/model/Project';

describe('ListProjects', () => {
  let listProjects: ListProjects;
  let mockProjectRepository: IProjectRepository;

  const projectId1 = 'project-id-1';
  const projectId2 = 'project-id-2';
  const projectName1 = 'Project 1';
  const projectName2 = 'Project 2';
  const projectDescription1 = 'Description 1';
  const projectDescription2 = 'Description 2';

  beforeEach(() => {
    mockProjectRepository = {
      findAll: vi.fn(),
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    listProjects = new ListProjects(mockProjectRepository);
  });

  describe('execute', () => {
    it('should return an empty array when no projects exist', async () => {
      vi.mocked(mockProjectRepository.findAll).mockResolvedValue([]);

      const result = await listProjects.execute();

      expect(result).toEqual([]);
      expect(mockProjectRepository.findAll).toHaveBeenCalled();
    });

    it('should return all projects as ProjectOutput', async () => {
      const createdAt1 = new Date('2024-01-01');
      const updatedAt1 = new Date('2024-01-01');
      const createdAt2 = new Date('2024-01-02');
      const updatedAt2 = new Date('2024-01-02');

      const project1 = Project.reconstruct(
        projectId1,
        projectName1,
        projectDescription1,
        createdAt1,
        updatedAt1
      );
      const project2 = Project.reconstruct(
        projectId2,
        projectName2,
        projectDescription2,
        createdAt2,
        updatedAt2
      );

      vi.mocked(mockProjectRepository.findAll).mockResolvedValue([
        project1,
        project2,
      ]);

      const result = await listProjects.execute();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(projectId1);
      expect(result[0].name).toBe(projectName1);
      expect(result[0].description).toBe(projectDescription1);
      expect(result[0].createdAt).toEqual(createdAt1);
      expect(result[0].updatedAt).toEqual(updatedAt1);

      expect(result[1].id).toBe(projectId2);
      expect(result[1].name).toBe(projectName2);
      expect(result[1].description).toBe(projectDescription2);
      expect(result[1].createdAt).toEqual(createdAt2);
      expect(result[1].updatedAt).toEqual(updatedAt2);

      expect(mockProjectRepository.findAll).toHaveBeenCalled();
    });

    it('should handle projects with null description', async () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-01');

      const project = Project.reconstruct(
        projectId1,
        projectName1,
        null,
        createdAt,
        updatedAt
      );

      vi.mocked(mockProjectRepository.findAll).mockResolvedValue([project]);

      const result = await listProjects.execute();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(projectId1);
      expect(result[0].name).toBe(projectName1);
      expect(result[0].description).toBeNull();
    });
  });
});

