import { ProjectRepositoryImpl } from '../../../infrastructure/project/projectRepositoryImpl';
import { ListProjects } from '../../../application/project/useCases/ListProjects';
import { JwtService } from '../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../infrastructure/auth/userRepositoryImpl';
import { UserType } from '../../../domain/user/model/UserType';

const projectRepository = new ProjectRepositoryImpl();
const listProjectsUseCase = new ListProjects(projectRepository);
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

  // 管理者・メンバーのみ全プロジェクトを返す
  // パートナー・顧客は空配列を返す
  if (isAdministratorOrMember(currentUser.userType.toNumber())) {
    const projects = await listProjectsUseCase.execute();
    return projects;
  }

  return [];
});

