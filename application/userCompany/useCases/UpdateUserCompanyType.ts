import { IUserCompanyRepository } from '../../../domain/user/repository/IUserCompanyRepository';
import { UserCompany } from '../../../domain/user/model/UserCompany';
import { UpdateUserCompanyTypeInput } from '../dto/UpdateUserCompanyTypeInput';
import { UserCompanyOutput } from '../dto/UserCompanyOutput';

export class UpdateUserCompanyType {
  constructor(private userCompanyRepository: IUserCompanyRepository) {}

  async execute(
    userId: string,
    companyId: string,
    input: UpdateUserCompanyTypeInput
  ): Promise<UserCompanyOutput | null> {
    const existing = await this.userCompanyRepository.findByUserIdAndCompanyId(userId, companyId);

    if (!existing) {
      return null;
    }

    const updatedUserCompany = UserCompany.reconstruct(
      existing.id,
      existing.userId,
      existing.companyId,
      input.userType as number,
      existing.createdAt,
      new Date()
    );

    const savedUserCompany = await this.userCompanyRepository.save(updatedUserCompany);

    return new UserCompanyOutput(
      savedUserCompany.id,
      savedUserCompany.userId,
      savedUserCompany.companyId,
      savedUserCompany.userType.toNumber(),
      savedUserCompany.createdAt,
      savedUserCompany.updatedAt
    );
  }
}

