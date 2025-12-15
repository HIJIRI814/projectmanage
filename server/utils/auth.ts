import { UserCompanyRepositoryImpl } from '../../infrastructure/user/userCompanyRepositoryImpl';
import { UserType } from '../../domain/user/model/UserType';

const userCompanyRepository = new UserCompanyRepositoryImpl();

/**
 * 特定の会社でユーザーがADMINISTRATORであるかをチェック
 * @param userId ユーザーID
 * @param companyId 会社ID
 * @returns 管理者の場合true、それ以外の場合false
 */
export async function isAdministratorInCompany(
  userId: string,
  companyId: string
): Promise<boolean> {
  const userCompany = await userCompanyRepository.findByUserIdAndCompanyId(
    userId,
    companyId
  );
  if (!userCompany) {
    return false;
  }
  return userCompany.userType.toNumber() === UserType.ADMINISTRATOR;
}

