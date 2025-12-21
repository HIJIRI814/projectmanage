import { SheetRepositoryImpl } from '~/infrastructure/sheet/sheetRepositoryImpl';
import { ListSheets } from '~/application/sheet/useCases/ListSheets';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const sheetRepository = new SheetRepositoryImpl();
const listSheetsUseCase = new ListSheets(sheetRepository);

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  const projectId = getRouterParam(event, 'id');
  if (!projectId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID is required',
    });
  }

  try {
    const sheets = await listSheetsUseCase.execute(projectId);
    return sheets;
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

