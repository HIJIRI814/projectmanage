import { SheetMarkerCommentRepositoryImpl } from '~/infrastructure/sheet/sheetMarkerCommentRepositoryImpl';
import { UserRepositoryImpl } from '~/infrastructure/auth/userRepositoryImpl';
import { GetSheetMarkerComments } from '~/application/sheet/useCases/GetSheetMarkerComments';
import { JwtService } from '~/infrastructure/auth/jwtService';

const sheetMarkerCommentRepository = new SheetMarkerCommentRepositoryImpl();
const userRepository = new UserRepositoryImpl();
const getSheetMarkerCommentsUseCase = new GetSheetMarkerComments(
  sheetMarkerCommentRepository,
  userRepository
);
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

  const markerId = getRouterParam(event, 'markerId');
  if (!markerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Marker ID is required',
    });
  }

  try {
    const comments = await getSheetMarkerCommentsUseCase.execute(markerId);
    return comments;
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

