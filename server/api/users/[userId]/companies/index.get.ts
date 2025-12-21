import { UserCompanyRepositoryImpl } from '../../../../../infrastructure/user/userCompanyRepositoryImpl';
import { GetUserCompanies } from '../../../../../application/userCompany/useCases/GetUserCompanies';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const userCompanyRepository = new UserCompanyRepositoryImpl();
const getUserCompaniesUseCase = new GetUserCompanies(userCompanyRepository);

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  const userId = getRouterParam(event, 'userId');
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    });
  }

  // 自分の所属会社のみ取得可能（管理者・メンバーは他のユーザーの所属会社も取得可能にする場合は条件を変更）
  if (currentUser.id !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden: You can only view your own companies',
    });
  }

  const userCompanies = await getUserCompaniesUseCase.execute(userId);
  return userCompanies;
});

