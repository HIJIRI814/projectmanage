import { UserType } from '~domain/user/model/UserType';

export class AddUserToCompanyInput {
  constructor(
    public readonly userId: string,
    public readonly companyId: string,
    public readonly userType: UserType = UserType.CUSTOMER
  ) {}
}

