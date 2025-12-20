import { CompanyRepositoryImpl } from '~infrastructure/company/companyRepositoryImpl';
import { JwtService } from '~infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '~infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '~infrastructure/user/userCompanyRepositoryImpl';
import { UserType } from '~domain/user/model/UserType';

const companyRepository = new CompanyRepositoryImpl();
const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
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

  // ユーザーが所属している会社を取得
  const userCompanies = await userCompanyRepository.findByUserId(currentUser.id);
  
  if (userCompanies.length === 0) {
    return [];
  }

  // 会社情報とユーザー種別を取得
  const companiesWithUserType = await Promise.all(
    userCompanies.map(async (uc) => {
      const company = await companyRepository.findById(uc.companyId);
      if (!company) {
        return null;
      }
      return {
        id: company.id,
        name: company.name,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        userType: uc.userType.toNumber(), // ユーザー種別を追加
      };
    })
  );

  // nullを除外して返す
  return companiesWithUserType.filter((company) => company !== null);
});

