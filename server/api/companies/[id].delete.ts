import { CompanyRepositoryImpl } from '~infrastructure/company/companyRepositoryImpl';
import { DeleteCompany } from '~application/company/useCases/DeleteCompany';
import { isAdministratorInCompany } from '../../utils/auth';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const companyRepository = new CompanyRepositoryImpl();
const deleteCompanyUseCase = new DeleteCompany(companyRepository);

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

  try {
    await deleteCompanyUseCase.execute(id);
    return { success: true };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    if (error.message === 'Company not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Company not found',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});

