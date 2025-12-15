import { UserRepositoryImpl } from '../../../infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../infrastructure/user/userCompanyRepositoryImpl';
import { SignUp } from '../../../application/auth/useCases/SignUp';
import { CreateUser } from '../../../application/user/useCases/CreateUser';
import { SignUpInput } from '../../../application/auth/dto/SignUpInput';
import { LoginUser } from '../../../application/auth/useCases/LoginUser';
import { LoginInput } from '../../../application/auth/dto/LoginInput';
import { AuthDomainService } from '../../../domain/user/service/AuthDomainService';
import { JwtService } from '../../../infrastructure/auth/jwtService';
import { z } from 'zod';

const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const authDomainService = new AuthDomainService();
const jwtService = new JwtService();
const createUserUseCase = new CreateUser(userRepository);
const signUpUseCase = new SignUp(createUserUseCase);
const loginUserUseCase = new LoginUser(userRepository, userCompanyRepository, authDomainService, jwtService);

const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const validationResult = signUpSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new SignUpInput(
      validationResult.data.email,
      validationResult.data.password,
      validationResult.data.name
    );

    // サインアップ
    const user = await signUpUseCase.execute(input);

    // 自動ログイン
    const loginInput = new LoginInput(validationResult.data.email, validationResult.data.password);
    const authResult = await loginUserUseCase.execute(loginInput);

    // トークンをCookieに設定
    setCookie(event, 'accessToken', authResult.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    setCookie(event, 'refreshToken', authResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return {
      user: authResult.user,
    };
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

