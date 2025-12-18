import { SheetMarkerRepositoryImpl } from '~/infrastructure/sheet/sheetMarkerRepositoryImpl';
import { DeleteSheetMarker } from '~/application/sheet/useCases/DeleteSheetMarker';
import { JwtService } from '~/infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '~/infrastructure/auth/userRepositoryImpl';
import { UserCompanyRepositoryImpl } from '~/infrastructure/user/userCompanyRepositoryImpl';
import { UserType } from '~/domain/user/model/UserType';

const sheetMarkerRepository = new SheetMarkerRepositoryImpl();
const deleteSheetMarkerUseCase = new DeleteSheetMarker(sheetMarkerRepository);
const userRepository = new UserRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();
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

  try {
    await deleteSheetMarkerUseCase.execute(markerId);
    return { success: true };
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

