import { CompanyRepositoryImpl } from '~infrastructure/company/companyRepositoryImpl';
import { UpdateCompany } from '~application/company/useCases/UpdateCompany';
import { UpdateCompanyInput } from '~application/company/dto/UpdateCompanyInput';
import { isAdministratorInCompany } from '../../utils/auth';
import { getCurrentUser } from '~/server/utils/getCurrentUser';
import { z } from 'zod';

const companyRepository = new CompanyRepositoryImpl();
const updateCompanyUseCase = new UpdateCompany(companyRepository);

const updateCompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Company ID is required',
    });
  }

  // 特定の会社での管理者権限チェック
  const isAdministrator = await isAdministratorInCompany(currentUser.id, id);
  if (!isAdministrator) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator access required for this company',
    });
  }

  const body = await readBody(event);

  try {
    const validationResult = updateCompanySchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.issues,
      });
    }

    const input = new UpdateCompanyInput(validationResult.data.name);

    const result = await updateCompanyUseCase.execute(id, input);

    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Company not found',
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

