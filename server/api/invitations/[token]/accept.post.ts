import { CompanyInvitationRepositoryImpl } from '../../../../infrastructure/company/companyInvitationRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../../infrastructure/user/userCompanyRepositoryImpl';
import { UserRepositoryImpl } from '../../../../infrastructure/auth/userRepositoryImpl';
import { AcceptInvitation } from '../../../../application/company/useCases/AcceptInvitation';
import { AcceptInvitationInput } from '../../../../application/company/dto/AcceptInvitationInput';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const invitationRepository = new CompanyInvitationRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const userRepository = new UserRepositoryImpl();
const acceptInvitationUseCase = new AcceptInvitation(
  invitationRepository,
  userCompanyRepository,
  userRepository
);

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token');
  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token is required',
    });
  }

  // 認証チェック（ログイン必須）
  const currentUser = await getCurrentUser(event);

  try {
    const input = new AcceptInvitationInput(token, currentUser.id);
    await acceptInvitationUseCase.execute(input);

    return { success: true };
  } catch (error: any) {
    if (error.message === 'Invitation not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invitation not found',
      });
    }

    if (error.message === 'Invitation has expired') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invitation has expired',
      });
    }

    if (error.message === 'Invitation cannot be accepted') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invitation cannot be accepted',
      });
    }

    if (error.message === 'User not found. Please sign up first.') {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found. Please sign up first.',
      });
    }

    if (error.message === 'User ID does not match invitation email') {
      throw createError({
        statusCode: 403,
        statusMessage: 'User ID does not match invitation email',
      });
    }

    if (error.message === 'User is already a member of this company') {
      throw createError({
        statusCode: 409,
        statusMessage: 'User is already a member of this company',
      });
    }

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});

