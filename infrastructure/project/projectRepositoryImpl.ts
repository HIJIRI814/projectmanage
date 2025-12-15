import { IProjectRepository } from '../../domain/project/model/IProjectRepository';
import { Project } from '../../domain/project/model/Project';
import { prismaClient } from '../prisma/prismaClient';

export class ProjectRepositoryImpl implements IProjectRepository {
  async findById(id: string): Promise<Project | null> {
    const projectData = await prismaClient.project.findUnique({
      where: { id },
      include: {
        projectCompanies: true,
      },
    });

    if (!projectData) {
      return null;
    }

    const companyIds = projectData.projectCompanies.map((pc) => pc.companyId);

    return Project.reconstruct(
      projectData.id,
      projectData.name,
      projectData.description,
      projectData.visibility,
      companyIds,
      projectData.createdAt,
      projectData.updatedAt
    );
  }

  async findAll(): Promise<Project[]> {
    const projectsData = await prismaClient.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        projectCompanies: true,
      },
    });

    return projectsData.map((projectData) => {
      const companyIds = projectData.projectCompanies.map((pc) => pc.companyId);
      return Project.reconstruct(
        projectData.id,
        projectData.name,
        projectData.description,
        projectData.visibility,
        companyIds,
        projectData.createdAt,
        projectData.updatedAt
      );
    });
  }

  async save(project: Project): Promise<Project> {
    const projectData = await prismaClient.project.upsert({
      where: { id: project.id },
      update: {
        name: project.name,
        description: project.description,
        visibility: project.visibility.toString(),
        updatedAt: new Date(),
      },
      create: {
        id: project.id,
        name: project.name,
        description: project.description,
        visibility: project.visibility.toString(),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      include: {
        projectCompanies: true,
      },
    });

    // ProjectCompanyのリレーションを更新
    const existingCompanyIds = projectData.projectCompanies.map((pc) => pc.companyId);
    const newCompanyIds = project.companyIds.filter((id) => !existingCompanyIds.includes(id));
    const removedCompanyIds = existingCompanyIds.filter((id) => !project.companyIds.includes(id));

    // 新しい会社を追加
    if (newCompanyIds.length > 0) {
      await prismaClient.projectCompany.createMany({
        data: newCompanyIds.map((companyId) => ({
          id: crypto.randomUUID(),
          projectId: project.id,
          companyId,
          createdAt: new Date(),
        })),
      });
    }

    // 削除された会社を削除
    if (removedCompanyIds.length > 0) {
      await prismaClient.projectCompany.deleteMany({
        where: {
          projectId: project.id,
          companyId: { in: removedCompanyIds },
        },
      });
    }

    // 更新後のデータを取得
    const updatedProjectData = await prismaClient.project.findUnique({
      where: { id: project.id },
      include: {
        projectCompanies: true,
      },
    });

    if (!updatedProjectData) {
      throw new Error('Project not found after save');
    }

    const companyIds = updatedProjectData.projectCompanies.map((pc) => pc.companyId);

    return Project.reconstruct(
      updatedProjectData.id,
      updatedProjectData.name,
      updatedProjectData.description,
      updatedProjectData.visibility,
      companyIds,
      updatedProjectData.createdAt,
      updatedProjectData.updatedAt
    );
  }

  async delete(id: string): Promise<void> {
    await prismaClient.project.delete({
      where: { id },
    });
  }
}



