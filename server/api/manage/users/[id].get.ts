import { UserRepositoryImpl } from '../../../../infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../../infrastructure/user/userCompanyRepositoryImpl';
import { UserOutput } from '../../../../application/user/dto/UserOutput';
import { UserType } from '../../../../domain/user/model/UserType';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();

async function getUserTypeInAnyCompany(userId: string): Promise<number | null> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return null;
  }
  // 最初の会社のuserTypeを返す（デフォルトとして）
  return userCompanies[0].userType.toNumber();
}

async function isAdministratorInAnyCompany(userId: string): Promise<boolean> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return false;
  }
  // いずれかの会社でADMINISTRATORであるかをチェック
  return userCompanies.some(
    (uc) => uc.userType.toNumber() === UserType.ADMINISTRATOR
  );
}

export default defineEventHandler(async (event) => {
  // 管理者権限チェック
  const currentUser = await getCurrentUser(event);
  const isAdministrator = await isAdministratorInAnyCompany(currentUser.id);
  if (!isAdministrator) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator access required',
    });
  }

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  try {
    const user = await userRepository.findById(id);
    
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }

    // UserCompanyからuserTypeを取得（最初の会社のuserTypeを使用）
    const userType = await getUserTypeInAnyCompany(user.id);

    return new UserOutput(
      user.id,
      user.email.toString(),
      user.name,
      userType || UserType.CUSTOMER,
      user.createdAt,
      user.updatedAt
    );
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



