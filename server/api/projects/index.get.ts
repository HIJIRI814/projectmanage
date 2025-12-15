import { ProjectRepositoryImpl } from '../../../infrastructure/project/projectRepositoryImpl';
import { ListProjects } from '../../../application/project/useCases/ListProjects';
import { ProjectAccessService } from '../../../application/project/service/ProjectAccessService';
import { JwtService } from '../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../infrastructure/user/userCompanyRepositoryImpl';
import { prismaClient } from '../../../infrastructure/prisma/prismaClient';
import { UserType } from '../../../domain/user/model/UserType';

const projectRepository = new ProjectRepositoryImpl();
const listProjectsUseCase = new ListProjects(projectRepository);
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

async function getUserTypeInAnyCompany(userId: string): Promise<number | null> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return null;
  }
  // 最初の会社のuserTypeを返す（デフォルトとして）
  return userCompanies[0].userType.toNumber();
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

  const allProjects = await listProjectsUseCase.execute();
  const accessibleProjects = [];

  for (const project of allProjects) {
    const projectEntity = await projectRepository.findById(project.id);
    if (!projectEntity) {
      continue;
    }

    const isMember = await isProjectMember(currentUser.id, project.id);
    const canAccess = await projectAccessService.canAccess(projectEntity, currentUser.id, isMember);

    if (canAccess) {
      accessibleProjects.push(project);
    }
  }

  return accessibleProjects;
});

