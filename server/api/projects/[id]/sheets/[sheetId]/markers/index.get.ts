import { SheetMarkerRepositoryImpl } from '~/infrastructure/sheet/sheetMarkerRepositoryImpl';
import { GetSheetMarkers } from '~/application/sheet/useCases/GetSheetMarkers';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const sheetMarkerRepository = new SheetMarkerRepositoryImpl();
const getSheetMarkersUseCase = new GetSheetMarkers(sheetMarkerRepository);

export default defineEventHandler(async (event) => {
  await getCurrentUser(event);

  const sheetId = getRouterParam(event, 'sheetId');
  if (!sheetId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Sheet ID is required',
    });
  }

  const query = getQuery(event);
  const versionId = query.versionId as string | undefined;
  const sheetVersionId = versionId && versionId !== '' ? versionId : null;

  try {
    const markers = await getSheetMarkersUseCase.execute(sheetId, sheetVersionId);
    return markers;
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

