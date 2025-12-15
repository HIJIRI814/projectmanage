import { UserCompanyRepositoryImpl } from '../../../../../infrastructure/user/userCompanyRepositoryImpl';
import { GetCompanyUsers } from '../../../../../application/userCompany/useCases/GetCompanyUsers';
import { JwtService } from '../../../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../../../infrastructure/auth/userRepositoryImpl';

const userCompanyRepository = new UserCompanyRepositoryImpl();
const getCompanyUsersUseCase = new GetCompanyUsers(userCompanyRepository);
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
  await getCurrentUser(event);

  const companyId = getRouterParam(event, 'id');
  if (!companyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Company ID is required',
    });
  }

  const users = await getCompanyUsersUseCase.execute(companyId);
  return users;
});

