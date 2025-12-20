import { IUserCompanyRepository } from '~domain/user/repository/IUserCompanyRepository';
import { UserCompany } from '~domain/user/model/UserCompany';
import { AddUserToCompanyInput } from '../dto/AddUserToCompanyInput';
import { UserCompanyOutput } from '../dto/UserCompanyOutput';
import { v4 as uuidv4 } from 'uuid';

export class AddUserToCompany {
  constructor(private userCompanyRepository: IUserCompanyRepository) {}

  async execute(input: AddUserToCompanyInput): Promise<UserCompanyOutput> {
    // 既存のUserCompanyをチェック
    const existing = await this.userCompanyRepository.findByUserIdAndCompanyId(
      input.userId,
      input.companyId
    );

    if (existing) {
      throw new Error('User is already a member of this company');
    }

    const userCompany = UserCompany.create(
      uuidv4(),
      input.userId,
      input.companyId,
      input.userType
    );

    const savedUserCompany = await this.userCompanyRepository.save(userCompany);

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

