import { IProjectRepository } from '../../domain/project/model/IProjectRepository';
import { Project } from '../../domain/project/model/Project';
import { prismaClient } from '../prisma/prismaClient';

export class ProjectRepositoryImpl implements IProjectRepository {
  async findById(id: string): Promise<Project | null> {
    const projectData = await prismaClient.project.findUnique({
      where: { id },
    });

    if (!projectData) {
      return null;
    }

    return Project.reconstruct(
      projectData.id,
      projectData.name,
      projectData.description,
      projectData.createdAt,
      projectData.updatedAt
    );
  }

  async findAll(): Promise<Project[]> {
    const projectsData = await prismaClient.project.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return projectsData.map((projectData) =>
      Project.reconstruct(
        projectData.id,
        projectData.name,
        projectData.description,
        projectData.createdAt,
        projectData.updatedAt
      )
    );
  }

  async save(project: Project): Promise<Project> {
    const projectData = await prismaClient.project.upsert({
      where: { id: project.id },
      update: {
        name: project.name,
        description: project.description,
        updatedAt: new Date(),
      },
      create: {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });

    return Project.reconstruct(
      projectData.id,
      projectData.name,
      projectData.description,
      projectData.createdAt,
      projectData.updatedAt
    );
  }

  async delete(id: string): Promise<void> {
    await prismaClient.project.delete({
      where: { id },
    });
  }
}

