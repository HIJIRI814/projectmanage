import { UserCompanyRepositoryImpl } from '../../../../../infrastructure/user/userCompanyRepositoryImpl';
import { UpdateUserCompanyType } from '../../../../../application/userCompany/useCases/UpdateUserCompanyType';
import { UpdateUserCompanyTypeInput } from '../../../../../application/userCompany/dto/UpdateUserCompanyTypeInput';
import { UserType } from '../../../../../domain/user/model/UserType';
import { isAdministratorInCompany } from '../../../../utils/auth';
import { getCurrentUser } from '~/server/utils/getCurrentUser';
import { z } from 'zod';

const userCompanyRepository = new UserCompanyRepositoryImpl();
const updateUserCompanyTypeUseCase = new UpdateUserCompanyType(userCompanyRepository);

const updateUserCompanyTypeSchema = z.object({
  userType: z.number().int().min(1).max(4),
});

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  const companyId = getRouterParam(event, 'id');
  if (!companyId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Company ID is required',
    });
  }

  // 特定の会社での管理者権限チェック
  const isAdministrator = await isAdministratorInCompany(currentUser.id, companyId);
  if (!isAdministrator) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator access required for this company',
    });
  }

  const userId = getRouterParam(event, 'userId');
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  const body = await readBody(event);

  try {
    const validationResult = updateUserCompanyTypeSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.issues,
      });
    }

    const input = new UpdateUserCompanyTypeInput(validationResult.data.userType as UserType);

    const result = await updateUserCompanyTypeUseCase.execute(userId, companyId, input);

    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'UserCompany not found',
      });
    }

    return result;
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

