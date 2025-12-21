import { SheetRepositoryImpl } from '~/infrastructure/sheet/sheetRepositoryImpl';
import { SheetVersionRepositoryImpl } from '~/infrastructure/sheet/sheetVersionRepositoryImpl';
import { SheetMarkerRepositoryImpl } from '~/infrastructure/sheet/sheetMarkerRepositoryImpl';
import { ImageBackupService } from '~/infrastructure/sheet/imageBackupService';
import { CreateSheetVersion } from '~/application/sheet/useCases/CreateSheetVersion';
import { UserCompanyRepositoryImpl } from '~/infrastructure/user/userCompanyRepositoryImpl';
import { CreateSheetVersionInput } from '~/application/sheet/dto/CreateSheetVersionInput';
import { UserType } from '~/domain/user/model/UserType';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const sheetRepository = new SheetRepositoryImpl();
const sheetVersionRepository = new SheetVersionRepositoryImpl();
const sheetMarkerRepository = new SheetMarkerRepositoryImpl();
const imageBackupService = new ImageBackupService();
const createSheetVersionUseCase = new CreateSheetVersion(
  sheetRepository,
  sheetVersionRepository,
  sheetMarkerRepository,
  imageBackupService
);
const userCompanyRepository = new UserCompanyRepositoryImpl();

async function getUserTypeInAnyCompany(userId: string): Promise<number | null> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return null;
  }
  // 最初の会社のuserTypeを返す（デフォルトとして）
  return userCompanies[0].userType.toNumber();
}

function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
}

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  // ユーザーのuserTypeを取得（最初の会社のuserTypeを使用）
  const userType = await getUserTypeInAnyCompany(currentUser.id);
  if (!userType || !isAdministratorOrMember(userType)) {
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

