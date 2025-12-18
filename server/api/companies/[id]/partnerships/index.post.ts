import { CompanyPartnershipRepositoryImpl } from '../../../../../infrastructure/company/companyPartnershipRepositoryImpl';
import { CompanyRepositoryImpl } from '../../../../../infrastructure/company/companyRepositoryImpl';
import { CreatePartnership } from '../../../../../application/company/useCases/CreatePartnership';
import { CreatePartnershipInput } from '../../../../../application/company/dto/CreatePartnershipInput';
import { JwtService } from '../../../../../infrastructure/auth/jwtService';
import { UserRepositoryImpl } from '../../../../../infrastructure/auth/userRepositoryImpl';
import { isAdministratorInCompany } from '../../../../utils/auth';
import { z } from 'zod';

const partnershipRepository = new CompanyPartnershipRepositoryImpl();
const companyRepository = new CompanyRepositoryImpl();
const createPartnershipUseCase = new CreatePartnership(partnershipRepository, companyRepository);
const userRepository = new UserRepositoryImpl();
const jwtService = new JwtService();

const createPartnershipSchema = z.object({
  partnerCompanyId: z.string().uuid('Invalid company ID format'),
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
    const validationResult = createPartnershipSchema.safeParse(body);
    if (!validationResult.success) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: validationResult.error.errors,
      });
    }

    const input = new CreatePartnershipInput(validationResult.data.partnerCompanyId);

    const partnership = await createPartnershipUseCase.execute(companyId, input);

    return partnership;
  } catch (error: any) {
    if (error.message === '自分自身を連携企業として追加することはできません') {
      throw createError({
        statusCode: 400,
        statusMessage: error.message,
      });
    }

    if (error.message === '既に連携企業として登録されています') {
      throw createError({
        statusCode: 409,
        statusMessage: error.message,
      });
    }

    if (error.message === '連携企業が見つかりません') {
      throw createError({
        statusCode: 404,
        statusMessage: error.message,
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

