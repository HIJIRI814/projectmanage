import { SheetRepositoryImpl } from '~/infrastructure/sheet/sheetRepositoryImpl';
import { SheetVersionRepositoryImpl } from '~/infrastructure/sheet/sheetVersionRepositoryImpl';
import { ImageBackupService } from '~/infrastructure/sheet/imageBackupService';
import { CreateSheetVersion } from '~/application/sheet/useCases/CreateSheetVersion';
import { JwtService } from '~/infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '~/infrastructure/auth/userRepositoryImpl';
import { CreateSheetVersionInput } from '~/application/sheet/dto/CreateSheetVersionInput';
import { UserType } from '~/domain/user/model/UserType';

const sheetRepository = new SheetRepositoryImpl();
const sheetVersionRepository = new SheetVersionRepositoryImpl();
const imageBackupService = new ImageBackupService();
const createSheetVersionUseCase = new CreateSheetVersion(
  sheetRepository,
  sheetVersionRepository,
  imageBackupService
);
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

function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
}

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  // 管理者・メンバーのみアクセス可能
  if (!isAdministratorOrMember(currentUser.userType.toNumber())) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator or Member access required',
    });
  }

  const sheetId = getRouterParam(event, 'sheetId');
  if (!sheetId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Sheet ID is required',
    });
  }

  try {
    const input = new CreateSheetVersionInput();
    const result = await createSheetVersionUseCase.execute(sheetId, input);

    return result;
  } catch (error: any) {
    if (error.message === 'Sheet not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sheet not found',
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

