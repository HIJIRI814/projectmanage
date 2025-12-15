import { IUserCompanyRepository } from '../../../domain/user/repository/IUserCompanyRepository';
import { UserCompanyOutput } from '../dto/UserCompanyOutput';

export class GetCompanyUsers {
  constructor(private userCompanyRepository: IUserCompanyRepository) {}

  async execute(companyId: string): Promise<UserCompanyOutput[]> {
    const userCompanies = await this.userCompanyRepository.findByCompanyId(companyId);

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

