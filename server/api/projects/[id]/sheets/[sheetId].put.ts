import { SheetRepositoryImpl } from '~/infrastructure/sheet/sheetRepositoryImpl';
import { UpdateSheet } from '~/application/sheet/useCases/UpdateSheet';
import { JwtService } from '~/infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '~/infrastructure/auth/userRepositoryImpl';
import { UpdateSheetInput } from '~/application/sheet/dto/UpdateSheetInput';
import { UserType } from '~/domain/user/model/UserType';
import { z } from 'zod';

const sheetRepository = new SheetRepositoryImpl();
const updateSheetUseCase = new UpdateSheet(sheetRepository);
const userRepository = new UserRepositoryImpl();
const jwtService = new JwtService();

const updateSheetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  content: z.string().optional(),
});

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

function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
}

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  // 管理者・メンバーのみアクセス可能
  if (!isAdministratorOrMember(currentUser.userType.toNumber())) {
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

  const body = await readBody(event);

  try {
    const validationResult = updateSheetSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new UpdateSheetInput(
      validationResult.data.name,
      validationResult.data.description,
      validationResult.data.content
    );

    const result = await updateSheetUseCase.execute(sheetId, input);

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

