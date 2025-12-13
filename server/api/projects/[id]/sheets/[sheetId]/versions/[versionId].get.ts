import { SheetVersionRepositoryImpl } from '~/infrastructure/sheet/sheetVersionRepositoryImpl';
import { GetSheetVersion } from '~/application/sheet/useCases/GetSheetVersion';
import { JwtService } from '~/infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '~/infrastructure/auth/userRepositoryImpl';

const sheetVersionRepository = new SheetVersionRepositoryImpl();
const getSheetVersionUseCase = new GetSheetVersion(sheetVersionRepository);
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

  const versionId = getRouterParam(event, 'versionId');
  if (!versionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Version ID is required',
    });
  }

  try {
    const version = await getSheetVersionUseCase.execute(versionId);
    return version;
  } catch (error: any) {
    if (error.message === 'SheetVersion not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'SheetVersion not found',
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

