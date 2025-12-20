import { CompanyInvitationRepositoryImpl } from '~infrastructure/company/companyInvitationRepositoryImpl';
import { CompanyRepositoryImpl } from '~infrastructure/company/companyRepositoryImpl';
import { GetInvitationByToken } from '~application/company/useCases/GetInvitationByToken';

const invitationRepository = new CompanyInvitationRepositoryImpl();
const companyRepository = new CompanyRepositoryImpl();
const getInvitationByTokenUseCase = new GetInvitationByToken(invitationRepository, companyRepository);

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token');
  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token is required',
    });
  }

  try {
    const invitation = await getInvitationByTokenUseCase.execute(token);

    if (!invitation) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invitation not found',
      });
    }

    return invitation;
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

