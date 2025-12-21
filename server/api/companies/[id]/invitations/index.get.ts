import { CompanyInvitationRepositoryImpl } from '../../../../../infrastructure/company/companyInvitationRepositoryImpl';
import { ListInvitations } from '../../../../../application/company/useCases/ListInvitations';
import { isAdministratorInCompany } from '../../../../utils/auth';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const invitationRepository = new CompanyInvitationRepositoryImpl();
const listInvitationsUseCase = new ListInvitations(invitationRepository);

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

  try {
    const invitations = await listInvitationsUseCase.execute(companyId);
    return invitations;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});

