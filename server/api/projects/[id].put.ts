import { ProjectRepositoryImpl } from '../../../infrastructure/project/projectRepositoryImpl';
import { UpdateProject } from '../../../application/project/useCases/UpdateProject';
import { JwtService } from '../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../infrastructure/auth/userRepositoryImpl';
import { UpdateProjectInput } from '../../../application/project/dto/UpdateProjectInput';
import { UserType } from '../../../domain/user/model/UserType';
import { z } from 'zod';

const projectRepository = new ProjectRepositoryImpl();
const updateProjectUseCase = new UpdateProject(projectRepository);
const userRepository = new UserRepositoryImpl();
const jwtService = new JwtService();

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
});

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

function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
}

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  // 管理者・メンバーのみアクセス可能
  if (!isAdministratorOrMember(currentUser.userType.toNumber())) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator or Member access required',
    });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
    });
  }

  const body = await readBody(event);

  try {
    const validationResult = updateProjectSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new UpdateProjectInput(
      validationResult.data.name,
      validationResult.data.description
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

