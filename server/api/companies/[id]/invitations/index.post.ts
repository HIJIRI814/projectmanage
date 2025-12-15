import { CompanyInvitationRepositoryImpl } from '../../../../../infrastructure/company/companyInvitationRepositoryImpl';
import { CreateInvitation } from '../../../../../application/company/useCases/CreateInvitation';
import { CreateInvitationInput } from '../../../../../application/company/dto/CreateInvitationInput';
import { JwtService } from '../../../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../../../infrastructure/auth/userRepositoryImpl';
import { isAdministratorInCompany } from '../../../../utils/auth';
import { z } from 'zod';

const invitationRepository = new CompanyInvitationRepositoryImpl();
const createInvitationUseCase = new CreateInvitation(invitationRepository);
const userRepository = new UserRepositoryImpl();
const jwtService = new JwtService();

const createInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
  userType: z.number().int().min(1).max(4),
});

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

  const body = await readBody(event);

  try {
    const validationResult = createInvitationSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new CreateInvitationInput(
      companyId,
      validationResult.data.email,
      validationResult.data.userType
    );

    const invitation = await createInvitationUseCase.execute(input, currentUser.id);

    // 招待リンクを生成
    const invitationLink = `${process.env.BASE_URL || 'http://localhost:3000'}/invitations/${invitation.token}`;

    return {
      ...invitation,
      invitationLink,
    };
  } catch (error: any) {
    if (error.message === 'A pending invitation already exists for this email in this company') {
      throw createError({
        statusCode: 409,
        statusMessage: 'A pending invitation already exists for this email in this company',
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

