import { IUserCompanyRepository } from '../../../domain/user/repository/IUserCompanyRepository';

export class RemoveUserFromCompany {
  constructor(private userCompanyRepository: IUserCompanyRepository) {}

  async execute(userId: string, companyId: string): Promise<void> {
    const userCompany = await this.userCompanyRepository.findByUserIdAndCompanyId(
      userId,
      companyId
    );

    if (!userCompany) {
      throw new Error('User is not a member of this company');
    }

    await this.userCompanyRepository.delete(userCompany.id);
  }
}

