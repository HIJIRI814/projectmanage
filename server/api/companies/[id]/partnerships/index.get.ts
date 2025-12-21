import { CompanyPartnershipRepositoryImpl } from '../../../../../infrastructure/company/companyPartnershipRepositoryImpl';
import { CompanyRepositoryImpl } from '../../../../../infrastructure/company/companyRepositoryImpl';
import { ListPartnerships } from '../../../../../application/company/useCases/ListPartnerships';
import { isAdministratorInCompany } from '../../../../utils/auth';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const partnershipRepository = new CompanyPartnershipRepositoryImpl();
const companyRepository = new CompanyRepositoryImpl();
const listPartnershipsUseCase = new ListPartnerships(partnershipRepository, companyRepository);

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

