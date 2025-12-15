import { describe, it, expect } from 'vitest';
import { Project } from './Project';
import { ProjectVisibility } from './ProjectVisibility';

describe('Project', () => {
  const projectId = 'test-project-id';
  const projectName = 'Test Project';
  const projectDescription = 'Test Description';

  describe('create', () => {
    it('should create a new Project', () => {
      const project = Project.create(projectId, projectName, projectDescription);

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(projectId);
      expect(project.name).toBe(projectName);
      expect(project.description).toBe(projectDescription);
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a Project with null description when not provided', () => {
      const project = Project.create(projectId, projectName);

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(projectId);
      expect(project.name).toBe(projectName);
      expect(project.description).toBeNull();
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should set createdAt and updatedAt to the same time on creation', () => {
      const project = Project.create(projectId, projectName, projectDescription);

      expect(project.createdAt.getTime()).toBe(project.updatedAt.getTime());
    });

    it('should create projects with different IDs', () => {
      const project1 = Project.create('id1', 'Project 1', 'Description 1');
      const project2 = Project.create('id2', 'Project 2', 'Description 2');

      expect(project1.id).toBe('id1');
      expect(project2.id).toBe('id2');
      expect(project1.id).not.toBe(project2.id);
    });
  });

  describe('reconstruct', () => {
    it('should reconstruct a Project from existing data', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const project = Project.reconstruct(
        projectId,
        projectName,
        projectDescription,
        ProjectVisibility.PRIVATE,
        [],
        createdAt,
        updatedAt
      );

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(projectId);
      expect(project.name).toBe(projectName);
      expect(project.description).toBe(projectDescription);
      expect(project.visibility.isPrivate()).toBe(true);
      expect(project.companyIds).toEqual([]);
      expect(project.createdAt).toEqual(createdAt);
      expect(project.updatedAt).toEqual(updatedAt);
    });

    it('should reconstruct a Project with null description', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const project = Project.reconstruct(
        projectId,
        projectName,
        null,
        ProjectVisibility.COMPANY_INTERNAL,
        ['company-1'],
        createdAt,
        updatedAt
      );

      expect(project).toBeInstanceOf(Project);
      expect(project.id).toBe(projectId);
      expect(project.name).toBe(projectName);
      expect(project.description).toBeNull();
      expect(project.visibility.isCompanyInternal()).toBe(true);
      expect(project.companyIds).toEqual(['company-1']);
      expect(project.createdAt).toEqual(createdAt);
      expect(project.updatedAt).toEqual(updatedAt);
    });

    it('should preserve different createdAt and updatedAt dates', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-15');

      const project = Project.reconstruct(
        projectId,
        projectName,
        projectDescription,
        ProjectVisibility.PUBLIC,
        ['company-1', 'company-2'],
        createdAt,
        updatedAt
      );

      expect(project.createdAt.getTime()).not.toBe(project.updatedAt.getTime());
      expect(project.createdAt).toEqual(createdAt);
      expect(project.updatedAt).toEqual(updatedAt);
      expect(project.visibility.isPublic()).toBe(true);
      expect(project.companyIds).toEqual(['company-1', 'company-2']);
    });
  });

  describe('immutability', () => {
    it('should have readonly properties', () => {
      const project = Project.create(projectId, projectName, projectDescription);

      // TypeScriptのコンパイル時チェックに依存
      // 実行時にはreadonlyは強制されないが、設計上は不変であるべき
      expect(project.id).toBe(projectId);
      expect(project.name).toBe(projectName);
      expect(project.description).toBe(projectDescription);
    });
  });
});



