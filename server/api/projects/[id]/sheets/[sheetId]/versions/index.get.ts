import { SheetVersionRepositoryImpl } from '~/infrastructure/sheet/sheetVersionRepositoryImpl';
import { ListSheetVersions } from '~/application/sheet/useCases/ListSheetVersions';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const sheetVersionRepository = new SheetVersionRepositoryImpl();
const listSheetVersionsUseCase = new ListSheetVersions(sheetVersionRepository);

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

