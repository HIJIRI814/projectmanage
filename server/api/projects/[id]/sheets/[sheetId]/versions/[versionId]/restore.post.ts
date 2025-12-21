import { SheetRepositoryImpl } from '~/infrastructure/sheet/sheetRepositoryImpl';
import { SheetVersionRepositoryImpl } from '~/infrastructure/sheet/sheetVersionRepositoryImpl';
import { RestoreSheetVersion } from '~/application/sheet/useCases/RestoreSheetVersion';
import { UserCompanyRepositoryImpl } from '~/infrastructure/user/userCompanyRepositoryImpl';
import { RestoreSheetVersionInput } from '~/application/sheet/dto/RestoreSheetVersionInput';
import { UserType } from '~/domain/user/model/UserType';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const sheetRepository = new SheetRepositoryImpl();
const sheetVersionRepository = new SheetVersionRepositoryImpl();
const restoreSheetVersionUseCase = new RestoreSheetVersion(sheetRepository, sheetVersionRepository);
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
  const versionId = getRouterParam(event, 'versionId');
  if (!sheetId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Sheet ID is required',
    });
  }
  if (!versionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Version ID is required',
    });
  }

  try {
    const input = new RestoreSheetVersionInput();
    const result = await restoreSheetVersionUseCase.execute(sheetId, versionId, input);

    return result;
  } catch (error: any) {
    if (error.message === 'SheetVersion not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'SheetVersion not found',
      });
    }
    if (error.message === 'Sheet not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Sheet not found',
      });
    }
    if (error.message === 'SheetVersion does not belong to the specified sheet') {
      throw createError({
        statusCode: 400,
        statusMessage: 'SheetVersion does not belong to the specified sheet',
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

