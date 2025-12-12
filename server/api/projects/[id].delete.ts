import { ProjectRepositoryImpl } from '../../../infrastructure/project/projectRepositoryImpl';
import { DeleteProject } from '../../../application/project/useCases/DeleteProject';
import { JwtService } from '../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../infrastructure/auth/userRepositoryImpl';
import { UserType } from '../../../domain/user/model/UserType';

const projectRepository = new ProjectRepositoryImpl();
const deleteProjectUseCase = new DeleteProject(projectRepository);
const userRepository = new UserRepositoryImpl();
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

