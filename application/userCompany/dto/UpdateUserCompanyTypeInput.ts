import { UserType } from '~domain/user/model/UserType';

export class UpdateUserCompanyTypeInput {
  constructor(public readonly userType: UserType) {}
}

