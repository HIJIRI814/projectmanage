import { SheetRepositoryImpl } from '~/infrastructure/sheet/sheetRepositoryImpl';
import { UpdateSheet } from '~/application/sheet/useCases/UpdateSheet';
import { UserCompanyRepositoryImpl } from '~/infrastructure/user/userCompanyRepositoryImpl';
import { UpdateSheetInput } from '~/application/sheet/dto/UpdateSheetInput';
import { UserType } from '~/domain/user/model/UserType';
import { getCurrentUser } from '~/server/utils/getCurrentUser';
import { z } from 'zod';

const sheetRepository = new SheetRepositoryImpl();
const updateSheetUseCase = new UpdateSheet(sheetRepository);
const userCompanyRepository = new UserCompanyRepositoryImpl();

const updateSheetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  content: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

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
        data: validationResult.error.issues,
      });
    }

    const input = new UpdateSheetInput(
      validationResult.data.name,
      validationResult.data.description,
      validationResult.data.content,
      validationResult.data.imageUrl
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

