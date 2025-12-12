import { UserRepositoryImpl } from '../../../../infrastructure/auth/userRepositoryImpl';
import { DeleteUser } from '../../../../application/user/useCases/DeleteUser';
import { JwtService } from '../../../../infrastructure/auth/jwtService';

const userRepository = new UserRepositoryImpl();
const deleteUserUseCase = new DeleteUser(userRepository);
const jwtService = new JwtService();

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

