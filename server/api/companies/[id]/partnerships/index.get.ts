import { CompanyPartnershipRepositoryImpl } from '../../../../../infrastructure/company/companyPartnershipRepositoryImpl';
import { CompanyRepositoryImpl } from '../../../../../infrastructure/company/companyRepositoryImpl';
import { ListPartnerships } from '../../../../../application/company/useCases/ListPartnerships';
import { JwtService } from '../../../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../../../infrastructure/auth/userRepositoryImpl';
import { isAdministratorInCompany } from '../../../../utils/auth';

const partnershipRepository = new CompanyPartnershipRepositoryImpl();
const companyRepository = new CompanyRepositoryImpl();
const listPartnershipsUseCase = new ListPartnerships(partnershipRepository, companyRepository);
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

  const partnerships = await listPartnershipsUseCase.execute(companyId);

  return partnerships;
});

