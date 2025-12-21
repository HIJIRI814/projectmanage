import { SheetMarkerRepositoryImpl } from '~/infrastructure/sheet/sheetMarkerRepositoryImpl';
import { UpdateSheetMarker } from '~/application/sheet/useCases/UpdateSheetMarker';
import { UpdateSheetMarkerInput } from '~/application/sheet/dto/UpdateSheetMarkerInput';
import { UserCompanyRepositoryImpl } from '~/infrastructure/user/userCompanyRepositoryImpl';
import { UserType } from '~/domain/user/model/UserType';
import { getCurrentUser } from '~/server/utils/getCurrentUser';
import { z } from 'zod';

const sheetMarkerRepository = new SheetMarkerRepositoryImpl();
const updateSheetMarkerUseCase = new UpdateSheetMarker(sheetMarkerRepository);
const userCompanyRepository = new UserCompanyRepositoryImpl();

const updateSheetMarkerSchema = z.object({
  x: z.number().min(0).max(100).optional().nullable(),
  y: z.number().min(0).max(100).optional().nullable(),
  width: z.number().min(0).max(100).optional().nullable(),
  height: z.number().min(0).max(100).optional().nullable(),
  note: z.string().optional().nullable(),
});

async function getUserTypeInAnyCompany(userId: string): Promise<number | null> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return null;
  }
  return userCompanies[0].userType.toNumber();
}

function isAdministratorOrMember(userType: number): boolean {
  return userType === UserType.ADMINISTRATOR || userType === UserType.MEMBER;
}

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  const userType = await getUserTypeInAnyCompany(currentUser.id);
  if (!userType || !isAdministratorOrMember(userType)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator or Member access required',
    });
  }

  const markerId = getRouterParam(event, 'markerId');
  if (!markerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Marker ID is required',
    });
  }

  const body = await readBody(event);

  try {
    const validationResult = updateSheetMarkerSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.issues,
      });
    }

    const input = new UpdateSheetMarkerInput(
      validationResult.data.x ?? null,
      validationResult.data.y ?? null,
      validationResult.data.width ?? null,
      validationResult.data.height ?? null,
      validationResult.data.note ?? null
    );

    const result = await updateSheetMarkerUseCase.execute(markerId, input);

    return result;
  } catch (error: any) {
    if (error.message === 'Marker not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Marker not found',
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

