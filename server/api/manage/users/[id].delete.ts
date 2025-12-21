import { UserRepositoryImpl } from '../../../../infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '../../../../infrastructure/user/userCompanyRepositoryImpl';
import { DeleteUser } from '../../../../application/user/useCases/DeleteUser';
import { UserType } from '../../../../domain/user/model/UserType';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
const deleteUserUseCase = new DeleteUser(userRepository);

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

async function checkAdministratorAccess(event: any) {
  const user = await getCurrentUser(event);
  const isAdministrator = await isAdministratorInAnyCompany(user.id);
  if (!isAdministrator) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator access required',
    });
  }
  return user;
}

export default defineEventHandler(async (event) => {
  // 管理者権限チェック
  const currentUser = await checkAdministratorAccess(event);

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  try {
    await deleteUserUseCase.execute(id, currentUser.id);

    return { success: true };
  } catch (error: any) {
    if (error.message === 'User not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      });
    }

    if (error.message === '管理者は自分自身を削除できません') {
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

