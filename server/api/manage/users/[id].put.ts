import { UserRepositoryImpl } from '../../../../infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../../infrastructure/user/userCompanyRepositoryImpl';
import { UpdateUser } from '../../../../application/user/useCases/UpdateUser';
import { JwtService } from '../../../../infrastructure/auth/jwtService';
import { UpdateUserInput } from '../../../../application/user/dto/UpdateUserInput';
import { UserType } from '../../../../domain/user/model/UserType';
import { z } from 'zod';

const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const updateUserUseCase = new UpdateUser(userRepository);
const jwtService = new JwtService();

const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  name: z.string().min(1, 'Name is required').optional(),
});

async function getUserTypeInAnyCompany(userId: string): Promise<number | null> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return null;
  }
  // 最初の会社のuserTypeを返す（デフォルトとして）
  return userCompanies[0].userType.toNumber();
}

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

    // UserCompanyからuserTypeを取得して管理者かチェック
    const userType = await getUserTypeInAnyCompany(userId);
    if (!userType || userType !== UserType.ADMINISTRATOR) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Administrator access required',
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
  // 管理者権限チェック
  const currentUser = await getCurrentUser(event);

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  const body = await readBody(event);

  try {
    const validationResult = updateUserSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new UpdateUserInput(
      validationResult.data.email,
      validationResult.data.password,
      validationResult.data.name
    );

    const result = await updateUserUseCase.execute(id, input, currentUser.id);

    return result;
  } catch (error: any) {
    if (error.message === 'User not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }

    if (error.message === 'Email already exists') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already exists',
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

