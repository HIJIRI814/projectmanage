import { UserRepositoryImpl } from '../../../infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../infrastructure/user/userCompanyRepositoryImpl';
import { JwtService } from '../../../infrastructure/auth/jwtService';

const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const jwtService = new JwtService();

export default defineEventHandler(async (event) => {
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
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }

    // UserCompanyからuserTypeを取得（最初の会社のuserTypeを使用）
    const userCompanies = await userCompanyRepository.findByUserId(userId);
    const userType = userCompanies.length > 0 ? userCompanies[0].userType.toNumber() : null;

    return {
      id: user.id,
      email: user.email.toString(),
      name: user.name,
      userType,
      userCompanies: userCompanies.map((uc) => ({
        id: uc.id,
        companyId: uc.companyId,
        userType: uc.userType.toNumber(),
      })),
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }
});

