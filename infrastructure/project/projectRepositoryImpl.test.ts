import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectRepositoryImpl } from './projectRepositoryImpl';
import { Project } from '../../domain/project/model/Project';
import { prismaClient } from '../prisma/prismaClient';

// Prismaクライアントをモック
vi.mock('../prisma/prismaClient', () => ({
  prismaClient: {
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('ProjectRepositoryImpl', () => {
  let repository: ProjectRepositoryImpl;
  const projectId = 'test-project-id';
  const projectName = 'Test Project';
  const projectDescription = 'Test Description';
  const createdAt = new Date('2024-01-01');
  const updatedAt = new Date('2024-01-02');

  beforeEach(() => {
    repository = new ProjectRepositoryImpl();
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a Project when project exists', async () => {
      const mockProjectData = {
        id: projectId,
        name: projectName,
        description: projectDescription,
        createdAt,
        updatedAt,
      };

      vi.mocked(prismaClient.project.findUnique).mockResolvedValue(mockProjectData);

      const project = await repository.findById(projectId);

      expect(project).toBeInstanceOf(Project);
      expect(project?.id).toBe(projectId);
      expect(project?.name).toBe(projectName);
      expect(project?.description).toBe(projectDescription);
      expect(prismaClient.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
      });
    });

    it('should return null when project does not exist', async () => {
      vi.mocked(prismaClient.project.findUnique).mockResolvedValue(null);

      const project = await repository.findById(projectId);

      expect(project).toBeNull();
      expect(prismaClient.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
      });
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      const mockProjectsData = [
        {
          id: projectId,
          name: projectName,
          description: projectDescription,
          createdAt,
          updatedAt,
        },
        {
          id: 'project-id-2',
          name: 'Project 2',
          description: 'Description 2',
          createdAt,
          updatedAt,
        },
      ];

      vi.mocked(prismaClient.project.findMany).mockResolvedValue(mockProjectsData);

      const projects = await repository.findAll();

      expect(projects).toHaveLength(2);
      expect(projects[0]).toBeInstanceOf(Project);
      expect(projects[0].id).toBe(projectId);
      expect(projects[1].id).toBe('project-id-2');
      expect(prismaClient.project.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no projects exist', async () => {
      vi.mocked(prismaClient.project.findMany).mockResolvedValue([]);

      const projects = await repository.findAll();

      expect(projects).toEqual([]);
    });

    it('should handle projects with null description', async () => {
      const mockProjectData = [
        {
          id: projectId,
          name: projectName,
          description: null,
          createdAt,
          updatedAt,
        },
      ];

      vi.mocked(prismaClient.project.findMany).mockResolvedValue(mockProjectData);

      const projects = await repository.findAll();

      expect(projects).toHaveLength(1);
      expect(projects[0].description).toBeNull();
    });
  });

  describe('save', () => {
    it('should create a new project when project does not exist', async () => {
      const project = Project.reconstruct(
        projectId,
        projectName,
        projectDescription,
        createdAt,
        updatedAt
      );

      const mockProjectData = {
        id: projectId,
        name: projectName,
        description: projectDescription,
        createdAt,
        updatedAt,
      };

      vi.mocked(prismaClient.project.upsert).mockResolvedValue(mockProjectData);

      const savedProject = await repository.save(project);

      expect(savedProject).toBeInstanceOf(Project);
      expect(savedProject.id).toBe(projectId);
      expect(prismaClient.project.upsert).toHaveBeenCalledWith({
        where: { id: projectId },
        update: {
          name: projectName,
          description: projectDescription,
          updatedAt: expect.any(Date),
        },
        create: {
          id: projectId,
          name: projectName,
          description: projectDescription,
          createdAt,
          updatedAt,
        },
      });
    });

    it('should update an existing project', async () => {
      const project = Project.reconstruct(
        projectId,
        'Updated Name',
        'Updated Description',
        createdAt,
        updatedAt
      );

      const mockProjectData = {
        id: projectId,
        name: 'Updated Name',
        description: 'Updated Description',
        createdAt,
        updatedAt: new Date(),
      };

      vi.mocked(prismaClient.project.upsert).mockResolvedValue(mockProjectData);

      const savedProject = await repository.save(project);

      expect(savedProject).toBeInstanceOf(Project);
      expect(savedProject.name).toBe('Updated Name');
      expect(prismaClient.project.upsert).toHaveBeenCalled();
    });

    it('should handle null description', async () => {
      const project = Project.reconstruct(
        projectId,
        projectName,
        null,
        createdAt,
        updatedAt
      );

      const mockProjectData = {
        id: projectId,
        name: projectName,
        description: null,
        createdAt,
        updatedAt,
      };

      vi.mocked(prismaClient.project.upsert).mockResolvedValue(mockProjectData);

      const savedProject = await repository.save(project);

      expect(savedProject.description).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a project', async () => {
      vi.mocked(prismaClient.project.delete).mockResolvedValue({
        id: projectId,
        name: projectName,
        description: projectDescription,
        createdAt,
        updatedAt,
      });

      await repository.delete(projectId);

      expect(prismaClient.project.delete).toHaveBeenCalledWith({
        where: { id: projectId },
      });
    });
  });
});



