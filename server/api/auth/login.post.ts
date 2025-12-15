import { UserRepositoryImpl } from '../../../infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../infrastructure/user/userCompanyRepositoryImpl';
import { AuthDomainService } from '../../../domain/user/service/AuthDomainService';
import { JwtService } from '../../../infrastructure/auth/jwtService';
import { LoginUser } from '../../../application/auth/useCases/LoginUser';
import { LoginInput } from '../../../application/auth/dto/LoginInput';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// シングルトンインスタンス
const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const authDomainService = new AuthDomainService();
const jwtService = new JwtService();
const loginUserUseCase = new LoginUser(
  userRepository,
  userCompanyRepository,
  authDomainService,
  jwtService
);

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    // バリデーション
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    // DTOの作成
    const input = new LoginInput(validationResult.data.email, validationResult.data.password);

    // ユースケースの実行
    const result = await loginUserUseCase.execute(input);

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    };
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
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

