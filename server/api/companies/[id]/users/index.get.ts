import { UserCompanyRepositoryImpl } from '../../../../../infrastructure/user/userCompanyRepositoryImpl';
import { GetCompanyUsers } from '../../../../../application/userCompany/useCases/GetCompanyUsers';
import { isAdministratorInCompany } from '../../../../utils/auth';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const userCompanyRepository = new UserCompanyRepositoryImpl();
const getCompanyUsersUseCase = new GetCompanyUsers(userCompanyRepository);

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

  const users = await getCompanyUsersUseCase.execute(companyId);
  return users;
});

