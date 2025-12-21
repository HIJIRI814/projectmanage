import { CompanyRepositoryImpl } from '~infrastructure/company/companyRepositoryImpl';
import { UserCompanyRepositoryImpl } from '~infrastructure/user/userCompanyRepositoryImpl';
import { getCurrentUser } from '~/server/utils/getCurrentUser';

const companyRepository = new CompanyRepositoryImpl();
const userCompanyRepository = new UserCompanyRepositoryImpl();

export default defineEventHandler(async (event) => {
  const currentUser = await getCurrentUser(event);

  // ユーザーが所属している会社を取得
  const userCompanies = await userCompanyRepository.findByUserId(currentUser.id);
  
  if (userCompanies.length === 0) {
    return [];
  }

  // 会社情報とユーザー種別を取得
  const companiesWithUserType = await Promise.all(
    userCompanies.map(async (uc) => {
      const company = await companyRepository.findById(uc.companyId);
      if (!company) {
        return null;
      }
      return {
        id: company.id,
        name: company.name,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        userType: uc.userType.toNumber(), // ユーザー種別を追加
      };
    })
  );

  // nullを除外して返す
  return companiesWithUserType.filter((company) => company !== null);
});

