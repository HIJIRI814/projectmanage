import { CompanyRepositoryImpl } from '~infrastructure/company/companyRepositoryImpl';
import { CreateCompany } from '~application/company/useCases/CreateCompany';
import { UserCompanyRepositoryImpl } from '~infrastructure/user/userCompanyRepositoryImpl';
import { CreateCompanyInput } from '~application/company/dto/CreateCompanyInput';
import { UserType } from '~domain/user/model/UserType';
import { getCurrentUser } from '~/server/utils/getCurrentUser';
import { z } from 'zod';

const companyRepository = new CompanyRepositoryImpl();
const createCompanyUseCase = new CreateCompany(companyRepository);
const userCompanyRepository = new UserCompanyRepositoryImpl();

const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

async function isAdministratorInAnyCompany(userId: string): Promise<boolean> {
  const userCompanies = await userCompanyRepository.findByUserId(userId);
  if (userCompanies.length === 0) {
    return false;
  }
  // いずれかの会社でADMINISTRATORであるかをチェック
  return userCompanies.some(
    (uc) => uc.userType.toNumber() === UserType.ADMINISTRATOR
  );
}

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  // 管理者権限チェック
  const isAdministrator = await isAdministratorInAnyCompany(currentUser.id);
  if (!isAdministrator) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: Administrator access required',
    });
  }

  const body = await readBody(event);

  try {
    const validationResult = createCompanySchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.issues,
      });
    }

    const input = new CreateCompanyInput(validationResult.data.name);

    const result = await createCompanyUseCase.execute(input);

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

