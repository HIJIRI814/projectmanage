import { CompanyRepositoryImpl } from '~infrastructure/company/companyRepositoryImpl';
import { GetCompany } from '~application/company/useCases/GetCompany';
import { isAdministratorInCompany } from '../../utils/auth';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const companyRepository = new CompanyRepositoryImpl();
const getCompanyUseCase = new GetCompany(companyRepository);

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

