import { UserRepositoryImpl } from '../../../../infrastructure/auth/userRepositoryImpl';
import { CreateUser } from '../../../../application/user/useCases/CreateUser';
import { JwtService } from '../../../../infrastructure/auth/jwtService';
import { CreateUserInput } from '../../../../application/user/dto/CreateUserInput';
import { UserType } from '../../../../domain/user/model/UserType';
import { z } from 'zod';

const userRepository = new UserRepositoryImpl();
const createUserUseCase = new CreateUser(userRepository);
const jwtService = new JwtService();

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  userType: z.number().int().min(1).max(4).optional().default(UserType.CUSTOMER),
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
  await getCurrentUser(event);

  const body = await readBody(event);

  try {
    const validationResult = createUserSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new CreateUserInput(
      validationResult.data.email,
      validationResult.data.password,
      validationResult.data.name,
      validationResult.data.userType
    );

    const result = await createUserUseCase.execute(input);

    return result;
  } catch (error: any) {
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

