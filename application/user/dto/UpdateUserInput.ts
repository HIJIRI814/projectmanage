import { UserType } from '../../../domain/user/model/UserType';

export class UpdateUserInput {
  constructor(
    public readonly email?: string,
    public readonly password?: string,
    public readonly name?: string,
    public readonly userType?: UserType
  ) {}
}



