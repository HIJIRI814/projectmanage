import { CompanyRepositoryImpl } from '../../../infrastructure/company/companyRepositoryImpl';
import { CreateCompany } from '../../../application/company/useCases/CreateCompany';
import { JwtService } from '../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../infrastructure/user/userCompanyRepositoryImpl';
import { CreateCompanyInput } from '../../../application/company/dto/CreateCompanyInput';
import { UserType } from '../../../domain/user/model/UserType';
import { z } from 'zod';

const companyRepository = new CompanyRepositoryImpl();
const createCompanyUseCase = new CreateCompany(companyRepository);
const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const jwtService = new JwtService();

const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
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

async function getUserTypeInAnyCompany(userId: string): Promise<number | null> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return null;
  }
  // 最初の会社のuserTypeを返す（デフォルトとして）
  return userCompanies[0].userType.toNumber();
}

function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
}

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  // ユーザーのuserTypeを取得（最初の会社のuserTypeを使用）
  const userType = await getUserTypeInAnyCompany(currentUser.id);
  if (!userType || !isAdministratorOrMember(userType)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator or Member access required',
    });
  }

  const body = await readBody(event);

  try {
    const validationResult = createCompanySchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new CreateCompanyInput(validationResult.data.name);

    const result = await createCompanyUseCase.execute(input);

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

