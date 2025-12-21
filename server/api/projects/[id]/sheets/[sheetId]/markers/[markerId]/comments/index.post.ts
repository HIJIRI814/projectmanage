import { SheetMarkerRepositoryImpl } from '~/infrastructure/sheet/sheetMarkerRepositoryImpl';
import { SheetMarkerCommentRepositoryImpl } from '~/infrastructure/sheet/sheetMarkerCommentRepositoryImpl';
import { UserRepositoryImpl } from '~/infrastructure/auth/userRepositoryImpl';
import { CreateSheetMarkerComment } from '~/application/sheet/useCases/CreateSheetMarkerComment';
import { CreateSheetMarkerCommentInput } from '~/application/sheet/dto/CreateSheetMarkerCommentInput';
import { getCurrentUser } from '~/server/utils/getCurrentUser';
import { z } from 'zod';

const sheetMarkerRepository = new SheetMarkerRepositoryImpl();
const sheetMarkerCommentRepository = new SheetMarkerCommentRepositoryImpl();
const userRepository = new UserRepositoryImpl();
const createSheetMarkerCommentUseCase = new CreateSheetMarkerComment(
  sheetMarkerRepository,
  sheetMarkerCommentRepository,
  userRepository
);

const createSheetMarkerCommentSchema = z.object({
  content: z.string().min(1),
  parentCommentId: z.string().uuid().optional().nullable(),
});

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  const markerId = getRouterParam(event, 'markerId');
  if (!markerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Marker ID is required',
    });
  }

  const body = await readBody(event);

  try {
    const validationResult = createSheetMarkerCommentSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.issues,
      });
    }

    const input = new CreateSheetMarkerCommentInput(
      validationResult.data.content,
      validationResult.data.parentCommentId ?? null
    );

    const result = await createSheetMarkerCommentUseCase.execute(markerId, currentUser.id, input);

    return result;
  } catch (error: any) {
    if (error.message === 'Marker not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Marker not found',
      });
    }
    if (error.message === 'Parent comment not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Parent comment not found',
      });
    }
    if (error.message === 'Cannot reply to a reply') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cannot reply to a reply',
      });
    }
    if (error.message === 'Parent comment does not belong to this marker') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Parent comment does not belong to this marker',
      });
    }
    if (error.message === 'User not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
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

