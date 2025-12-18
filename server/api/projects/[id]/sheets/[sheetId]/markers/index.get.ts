import { SheetMarkerRepositoryImpl } from '~/infrastructure/sheet/sheetMarkerRepositoryImpl';
import { GetSheetMarkers } from '~/application/sheet/useCases/GetSheetMarkers';
import { JwtService } from '~/infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '~/infrastructure/auth/userRepositoryImpl';

const sheetMarkerRepository = new SheetMarkerRepositoryImpl();
const getSheetMarkersUseCase = new GetSheetMarkers(sheetMarkerRepository);
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

