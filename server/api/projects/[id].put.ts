import { ProjectRepositoryImpl } from '~infrastructure/project/projectRepositoryImpl';
import { UpdateProject } from '~application/project/useCases/UpdateProject';
import { ProjectAccessService } from '~application/project/service/ProjectAccessService';
import { UserCompanyRepositoryImpl } from '~infrastructure/user/userCompanyRepositoryImpl';
import { UpdateProjectInput } from '~application/project/dto/UpdateProjectInput';
import { ProjectVisibility } from '~domain/project/model/ProjectVisibility';
import { prismaClient } from '~infrastructure/prisma/prismaClient';
import { getCurrentUser } from '~/server/utils/getCurrentUser';
import { z } from 'zod';

const projectRepository = new ProjectRepositoryImpl();
const updateProjectUseCase = new UpdateProject(projectRepository);
const userCompanyRepository = new UserCompanyRepositoryImpl();
const projectAccessService = new ProjectAccessService(userCompanyRepository);

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  visibility: z.enum(['PRIVATE', 'COMPANY_INTERNAL', 'PUBLIC']).optional(),
  companyIds: z.array(z.string()).optional(),
  clientCompanyIds: z.array(z.string()).optional(),
});

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
      statusMessage: 'Forbidden: You do not have permission to edit this project',
    });
  }

  const body = await readBody(event);

  try {
    const validationResult = updateProjectSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.issues,
      });
    }

    const visibility = validationResult.data.visibility
      ? (validationResult.data.visibility as ProjectVisibility)
      : undefined;

    const input = new UpdateProjectInput(
      validationResult.data.name,
      validationResult.data.description,
      visibility,
      validationResult.data.companyIds,
      validationResult.data.clientCompanyIds
    );

    const result = await updateProjectUseCase.execute(id, input);

    return result;
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

