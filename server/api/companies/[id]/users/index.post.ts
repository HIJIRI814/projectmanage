import { UserCompanyRepositoryImpl } from '../../../../../infrastructure/user/userCompanyRepositoryImpl';
import { AddUserToCompany } from '../../../../../application/userCompany/useCases/AddUserToCompany';
import { AddUserToCompanyInput } from '../../../../../application/userCompany/dto/AddUserToCompanyInput';
import { UserType } from '../../../../../domain/user/model/UserType';
import { isAdministratorInCompany } from '../../../../utils/auth';
import { getCurrentUser } from '~/server/utils/getCurrentUser';
import { z } from 'zod';

const userCompanyRepository = new UserCompanyRepositoryImpl();
const addUserToCompanyUseCase = new AddUserToCompany(userCompanyRepository);

const addUserToCompanySchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  userType: z.number().int().min(1).max(4).optional(),
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

  const body = await readBody(event);

  try {
    const validationResult = addUserToCompanySchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.issues,
      });
    }

    const input = new AddUserToCompanyInput(
      validationResult.data.userId,
      companyId,
      (validationResult.data.userType as UserType) || UserType.CUSTOMER
    );

    const result = await addUserToCompanyUseCase.execute(input);

    return result;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    if (error.message === 'User is already a member of this company') {
      throw createError({
        statusCode: 409,
        statusMessage: 'User is already a member of this company',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    });
  }
});

