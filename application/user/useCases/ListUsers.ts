import { IUserRepository } from '../../../domain/user/model/IUserRepository';
import { IUserCompanyRepository } from '../../../domain/user/repository/IUserCompanyRepository';
import { UserOutput } from '../dto/UserOutput';
import { UserType } from '../../../domain/user/model/UserType';

export class ListUsers {
  constructor(
    private userRepository: IUserRepository,
    private userCompanyRepository: IUserCompanyRepository
  ) {}

  async execute(): Promise<UserOutput[]> {
    const users = await this.userRepository.findAll();

    // 各ユーザーのuserTypeをUserCompanyから取得
    const userOutputs = await Promise.all(
      users.map(async (user) => {
        const userCompanies = await this.userCompanyRepository.findByUserId(user.id);
        const userType = userCompanies.length > 0 ? userCompanies[0].userType.toNumber() : UserType.CUSTOMER;

        return new UserOutput(
          user.id,
          user.email.toString(),
          user.name,
          userType,
          user.createdAt,
          user.updatedAt
        );
      })
    );

    return userOutputs;
  }
}

