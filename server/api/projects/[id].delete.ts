import { ProjectRepositoryImpl } from '~infrastructure/project/projectRepositoryImpl';
import { DeleteProject } from '~application/project/useCases/DeleteProject';
import { ProjectAccessService } from '~application/project/service/ProjectAccessService';
import { JwtService } from '~infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '~infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '~infrastructure/user/userCompanyRepositoryImpl';
import { UserType } from '~domain/user/model/UserType';
import { prismaClient } from '~infrastructure/prisma/prismaClient';

const projectRepository = new ProjectRepositoryImpl();
const deleteProjectUseCase = new DeleteProject(projectRepository);
const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const projectAccessService = new ProjectAccessService(userCompanyRepository);
const jwtService = new JwtService();

async function getCurrentUser(event: any) {
  const accessTokenCookie = getCookie(event, 'accessToken');
  if (!accessTokenCookie) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }

  try {
    const { userId } = jwtService.verifyAccessToken(accessTokenCookie);
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
      });
    }

    return user;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
}

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

  // プロジェクトの存在確認とアクセス権限チェック
  const project = await projectRepository.findById(id);
  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project not found',
    });
  }

  const isMember = await isProjectMember(currentUser.id, project.id);
  const canEdit = await projectAccessService.canEdit(project, currentUser.id, isMember);

  if (!canEdit) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: You do not have permission to delete this project',
    });
  }

  try {
    await deleteProjectUseCase.execute(id);

    return { success: true };
  } catch (error: any) {
    if (error.message === 'Project not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Project not found',
      });
    }

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});

