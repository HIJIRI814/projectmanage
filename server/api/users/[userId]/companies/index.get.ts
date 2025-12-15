import { UserCompanyRepositoryImpl } from '../../../../../infrastructure/user/userCompanyRepositoryImpl';
import { GetUserCompanies } from '../../../../../application/userCompany/useCases/GetUserCompanies';
import { JwtService } from '../../../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../../../infrastructure/auth/userRepositoryImpl';

const userCompanyRepository = new UserCompanyRepositoryImpl();
const getUserCompaniesUseCase = new GetUserCompanies(userCompanyRepository);
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

  const userId = getRouterParam(event, 'userId');
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  // 自分の所属会社のみ取得可能（管理者・メンバーは他のユーザーの所属会社も取得可能にする場合は条件を変更）
  if (currentUser.id !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: You can only view your own companies',
    });
  }

  const userCompanies = await getUserCompaniesUseCase.execute(userId);
  return userCompanies;
});

