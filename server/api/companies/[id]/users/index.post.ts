import { UserCompanyRepositoryImpl } from '../../../../../infrastructure/user/userCompanyRepositoryImpl';
import { AddUserToCompany } from '../../../../../application/userCompany/useCases/AddUserToCompany';
import { JwtService } from '../../../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../../../infrastructure/auth/userRepositoryImpl';
import { AddUserToCompanyInput } from '../../../../../application/userCompany/dto/AddUserToCompanyInput';
import { UserType } from '../../../../../domain/user/model/UserType';
import { z } from 'zod';

const userCompanyRepository = new UserCompanyRepositoryImpl();
const addUserToCompanyUseCase = new AddUserToCompany(userCompanyRepository);
const userRepository = new UserRepositoryImpl();
const jwtService = new JwtService();

const addUserToCompanySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  userType: z.number().int().min(1).max(4).optional(),
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

  const body = await readBody(event);

  try {
    const validationResult = addUserToCompanySchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new AddUserToCompanyInput(
      validationResult.data.userId,
      companyId,
      (validationResult.data.userType as UserType) || UserType.CUSTOMER
    );

    const result = await addUserToCompanyUseCase.execute(input);

    return result;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    if (error.message === 'User is already a member of this company') {
      throw createError({
        statusCode: 409,
        statusMessage: 'User is already a member of this company',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});

