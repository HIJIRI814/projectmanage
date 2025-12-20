import { CompanyRepositoryImpl } from '~infrastructure/company/companyRepositoryImpl';
import { GetCompany } from '~application/company/useCases/GetCompany';
import { JwtService } from '~infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '~infrastructure/auth/userRepositoryImpl';
import { isAdministratorInCompany } from '../../utils/auth';

const companyRepository = new CompanyRepositoryImpl();
const getCompanyUseCase = new GetCompany(companyRepository);
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

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Company ID is required',
    });
  }

  // 特定の会社での管理者権限チェック
  const isAdministrator = await isAdministratorInCompany(currentUser.id, id);
  if (!isAdministrator) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator access required for this company',
    });
  }

  const company = await getCompanyUseCase.execute(id);

  if (!company) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Company not found',
    });
  }

  return company;
});

