import { SheetVersionRepositoryImpl } from '~/infrastructure/sheet/sheetVersionRepositoryImpl';
import { ListSheetVersions } from '~/application/sheet/useCases/ListSheetVersions';
import { JwtService } from '~/infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '~/infrastructure/auth/userRepositoryImpl';

const sheetVersionRepository = new SheetVersionRepositoryImpl();
const listSheetVersionsUseCase = new ListSheetVersions(sheetVersionRepository);
const userRepository = new UserRepositoryImpl();
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

export default defineEventHandler(async (event) => {
  await getCurrentUser(event); // 認証チェックのみ

  const sheetId = getRouterParam(event, 'sheetId');
  if (!sheetId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Sheet ID is required',
    });
  }

  try {
    const versions = await listSheetVersionsUseCase.execute(sheetId);
    return versions;
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

