import { UserRepositoryImpl } from '../../../../infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../../infrastructure/user/userCompanyRepositoryImpl';
import { JwtService } from '../../../../infrastructure/auth/jwtService';
import { UserOutput } from '../../../../application/user/dto/UserOutput';
import { UserType } from '../../../../domain/user/model/UserType';

const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const jwtService = new JwtService();

async function getUserTypeInAnyCompany(userId: string): Promise<number | null> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return null;
  }
  // 最初の会社のuserTypeを返す（デフォルトとして）
  return userCompanies[0].userType.toNumber();
}

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

    // UserCompanyからuserTypeを取得して管理者かチェック
    const userType = await getUserTypeInAnyCompany(userId);
    if (!userType || userType !== UserType.ADMINISTRATOR) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Administrator access required',
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
  // 管理者権限チェック
  await getCurrentUser(event);

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  try {
    const user = await userRepository.findById(id);
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }

    // UserCompanyからuserTypeを取得（最初の会社のuserTypeを使用）
    const userType = await getUserTypeInAnyCompany(user.id);

    return new UserOutput(
      user.id,
      user.email.toString(),
      user.name,
      userType || UserType.CUSTOMER,
      user.createdAt,
      user.updatedAt
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



