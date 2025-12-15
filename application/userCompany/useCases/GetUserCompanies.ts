import { IUserCompanyRepository } from '../../../domain/user/repository/IUserCompanyRepository';
import { UserCompanyOutput } from '../dto/UserCompanyOutput';

export class GetUserCompanies {
  constructor(private userCompanyRepository: IUserCompanyRepository) {}

  async execute(userId: string): Promise<UserCompanyOutput[]> {
    const userCompanies = await this.userCompanyRepository.findByUserId(userId);

    return userCompanies.map(
      (userCompany) =>
        new UserCompanyOutput(
          userCompany.id,
          userCompany.userId,
          userCompany.companyId,
          userCompany.userType.toNumber(),
          userCompany.createdAt,
          userCompany.updatedAt
        )
    );
  }
}

