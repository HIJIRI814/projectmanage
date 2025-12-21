import { SheetRepositoryImpl } from '~/infrastructure/sheet/sheetRepositoryImpl';
import { GetSheet } from '~/application/sheet/useCases/GetSheet';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const sheetRepository = new SheetRepositoryImpl();
const getSheetUseCase = new GetSheet(sheetRepository);

export default defineEventHandler(async (event) => {
  await getCurrentUser(event);

  const sheetId = getRouterParam(event, 'sheetId');
  if (!sheetId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Sheet ID is required',
    });
  }

  try {
    const sheet = await getSheetUseCase.execute(sheetId);
    return sheet;
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

