import { UserCompanyRepositoryImpl } from '../../../../../infrastructure/user/userCompanyRepositoryImpl';
import { RemoveUserFromCompany } from '../../../../../application/userCompany/useCases/RemoveUserFromCompany';
import { JwtService } from '../../../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../../../infrastructure/auth/userRepositoryImpl';
import { UserType } from '../../../../../domain/user/model/UserType';

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

async function getUserTypeInCompany(userId: string, companyId: string): Promise<number | null> {
  const userCompany = await userCompanyRepository.findByUserIdAndCompanyId(userId, companyId);
  return userCompany ? userCompany.userType.toNumber() : null;
}

function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
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

  // その会社でのuserTypeを取得
  const userType = await getUserTypeInCompany(currentUser.id, companyId);
  if (!userType || !isAdministratorOrMember(userType)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator or Member access required in this company',
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

