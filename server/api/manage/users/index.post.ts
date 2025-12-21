import { UserRepositoryImpl } from '../../../../infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../../infrastructure/user/userCompanyRepositoryImpl';
import { CreateUser } from '../../../../application/user/useCases/CreateUser';
import { CreateUserInput } from '../../../../application/user/dto/CreateUserInput';
import { UserType } from '../../../../domain/user/model/UserType';
import { getCurrentUser } from '~/server/utils/getCurrentUser';
import { z } from 'zod';

const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const createUserUseCase = new CreateUser(userRepository);

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

async function getUserTypeInAnyCompany(userId: string): Promise<number | null> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return null;
  }
  // 最初の会社のuserTypeを返す（デフォルトとして）
  return userCompanies[0].userType.toNumber();
}

async function checkAdministratorAccess(event: any) {
  const user = await getCurrentUser(event);
  const userType = await getUserTypeInAnyCompany(user.id);
  if (!userType || userType !== UserType.ADMINISTRATOR) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator access required',
    });
  }
  return user;
}

export default defineEventHandler(async (event) => {
  // 管理者権限チェック
  await checkAdministratorAccess(event);

  const body = await readBody(event);

  try {
    const validationResult = createUserSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.issues,
      });
    }

    // userTypeはCreateUserInputから削除（UserCompanyで管理するため）
    const input = new CreateUserInput(
      validationResult.data.email,
      validationResult.data.password,
      validationResult.data.name
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



