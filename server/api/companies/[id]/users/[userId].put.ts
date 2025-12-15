import { UserCompanyRepositoryImpl } from '../../../../../infrastructure/user/userCompanyRepositoryImpl';
import { UpdateUserCompanyType } from '../../../../../application/userCompany/useCases/UpdateUserCompanyType';
import { JwtService } from '../../../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../../../infrastructure/auth/userRepositoryImpl';
import { UpdateUserCompanyTypeInput } from '../../../../../application/userCompany/dto/UpdateUserCompanyTypeInput';
import { UserType } from '../../../../../domain/user/model/UserType';
import { z } from 'zod';

const userCompanyRepository = new UserCompanyRepositoryImpl();
const updateUserCompanyTypeUseCase = new UpdateUserCompanyType(userCompanyRepository);
const userRepository = new UserRepositoryImpl();
const jwtService = new JwtService();

const updateUserCompanyTypeSchema = z.object({
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

async function getUserTypeInCompany(userId: string, companyId: string): Promise<number | null> {
  const userCompany = await userCompanyRepository.findByUserIdAndCompanyId(userId, companyId);
  return userCompany ? userCompany.userType.toNumber() : null;
}

function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
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

  // その会社でのuserTypeを取得
  const userType = await getUserTypeInCompany(currentUser.id, companyId);
  if (!userType || !isAdministratorOrMember(userType)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator or Member access required in this company',
    });
  }

  const userId = getRouterParam(event, 'userId');
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  const body = await readBody(event);

  try {
    const validationResult = updateUserCompanyTypeSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new UpdateUserCompanyTypeInput(validationResult.data.userType as UserType);

    const result = await updateUserCompanyTypeUseCase.execute(userId, companyId, input);

    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'UserCompany not found',
      });
    }

    return result;
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

