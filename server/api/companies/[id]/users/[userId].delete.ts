import { UserCompanyRepositoryImpl } from '../../../../../infrastructure/user/userCompanyRepositoryImpl';
import { RemoveUserFromCompany } from '../../../../../application/userCompany/useCases/RemoveUserFromCompany';
import { JwtService } from '../../../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../../../infrastructure/auth/userRepositoryImpl';
import { isAdministratorInCompany } from '../../../../utils/auth';

const userCompanyRepository = new UserCompanyRepositoryImpl();
const removeUserFromCompanyUseCase = new RemoveUserFromCompany(userCompanyRepository);
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

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  const companyId = getRouterParam(event, 'id');
  if (!companyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Company ID is required',
    });
  }

  // 特定の会社での管理者権限チェック
  const isAdministrator = await isAdministratorInCompany(currentUser.id, companyId);
  if (!isAdministrator) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator access required for this company',
    });
  }

  const userId = getRouterParam(event, 'userId');
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  try {
    await removeUserFromCompanyUseCase.execute(userId, companyId);
    return { success: true };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    if (error.message === 'User is not a member of this company') {
      throw createError({
        statusCode: 404,
        statusMessage: 'User is not a member of this company',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});

