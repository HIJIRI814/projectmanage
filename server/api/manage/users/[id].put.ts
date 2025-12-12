import { UserRepositoryImpl } from '../../../../infrastructure/auth/userRepositoryImpl';
import { UpdateUser } from '../../../../application/user/useCases/UpdateUser';
import { JwtService } from '../../../../infrastructure/auth/jwtService';
import { UpdateUserInput } from '../../../../application/user/dto/UpdateUserInput';
import { UserType } from '../../../../domain/user/model/UserType';
import { z } from 'zod';

const userRepository = new UserRepositoryImpl();
const updateUserUseCase = new UpdateUser(userRepository);
const jwtService = new JwtService();

const updateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  name: z.string().min(1, 'Name is required').optional(),
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
    
    if (!user || !user.isAdministrator()) {
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
      validationResult.data.name,
      validationResult.data.userType ? (validationResult.data.userType as UserType) : undefined
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

    if (error.message === '管理者は自分自身のユーザー種別を変更できません') {
      throw createError({
        statusCode: 403,
        statusMessage: error.message,
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

