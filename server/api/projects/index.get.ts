import { ProjectRepositoryImpl } from '~infrastructure/project/projectRepositoryImpl';
import { ListProjects } from '~application/project/useCases/ListProjects';
import { ProjectAccessService } from '~application/project/service/ProjectAccessService';
import { UserCompanyRepositoryImpl } from '~infrastructure/user/userCompanyRepositoryImpl';
import { prismaClient } from '~infrastructure/prisma/prismaClient';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const projectRepository = new ProjectRepositoryImpl();
const listProjectsUseCase = new ListProjects(projectRepository);
const userCompanyRepository = new UserCompanyRepositoryImpl();
const projectAccessService = new ProjectAccessService(userCompanyRepository);

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
  try {
    const currentUser = await getCurrentUser(event);
    console.log(`[Projects API] Current user: ${currentUser.id} (${currentUser.email})`);

    const allProjects = await listProjectsUseCase.execute();
    console.log(`[Projects API] Total projects: ${allProjects.length}`);
    
    const accessibleProjects = [];

    for (const project of allProjects) {
      const projectEntity = await projectRepository.findById(project.id);
      if (!projectEntity) {
        console.log(`[Projects API] Project ${project.id} not found in repository`);
        continue;
      }

      const isMember = await isProjectMember(currentUser.id, project.id);
      const canAccess = await projectAccessService.canAccess(projectEntity, currentUser.id, isMember);
      
      console.log(`[Projects API] Project ${project.id}: visibility=${projectEntity.visibility.toString()}, isMember=${isMember}, canAccess=${canAccess}, companyIds=${projectEntity.companyIds.length > 0 ? projectEntity.companyIds.join(',') : 'none'}`);

      if (canAccess) {
        accessibleProjects.push(project);
      }
    }

    console.log(`[Projects API] Accessible projects: ${accessibleProjects.length}`);
    return accessibleProjects;
  } catch (error: any) {
    console.error('[Projects API] Error:', error);
    throw error;
  }
});

