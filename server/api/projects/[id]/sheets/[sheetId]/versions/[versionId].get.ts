import { SheetVersionRepositoryImpl } from '~/infrastructure/sheet/sheetVersionRepositoryImpl';
import { GetSheetVersion } from '~/application/sheet/useCases/GetSheetVersion';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const sheetVersionRepository = new SheetVersionRepositoryImpl();
const getSheetVersionUseCase = new GetSheetVersion(sheetVersionRepository);

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

