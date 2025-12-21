import { ProjectRepositoryImpl } from '~infrastructure/project/projectRepositoryImpl';
import { GetProject } from '~application/project/useCases/GetProject';
import { ProjectAccessService } from '~application/project/service/ProjectAccessService';
import { ProjectOutput } from '~application/project/dto/ProjectOutput';
import { UserCompanyRepositoryImpl } from '~infrastructure/user/userCompanyRepositoryImpl';
import { prismaClient } from '~infrastructure/prisma/prismaClient';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const projectRepository = new ProjectRepositoryImpl();
const getProjectUseCase = new GetProject(projectRepository);
const userCompanyRepository = new UserCompanyRepositoryImpl();
const projectAccessService = new ProjectAccessService(userCompanyRepository);

async function isProjectMember(userId: string, projectId: string): Promise<boolean> {
  const projectMember = await prismaClient.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
  return !!projectMember;
}

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
    });
  }

  try {
    const project = await projectRepository.findById(id);

    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Project not found',
      });
    }

    // アクセス権限チェック
    const isMember = await isProjectMember(currentUser.id, project.id);
    const canAccess = await projectAccessService.canAccess(project, currentUser.id, isMember);

    if (!canAccess) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: You do not have access to this project',
      });
    }

    return new ProjectOutput(
      project.id,
      project.name,
      project.description,
      project.visibility.toString(),
      project.companyIds,
      project.clientCompanyIds,
      project.createdAt,
      project.updatedAt
    );
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});

