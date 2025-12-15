import { UserType, UserTypeValue } from './UserType';

export class UserCompany {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly companyId: string,
    public readonly userType: UserTypeValue,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    id: string,
    userId: string,
    companyId: string,
    userType: UserType = UserType.CUSTOMER
  ): UserCompany {
    const now = new Date();
    return new UserCompany(
      id,
      userId,
      companyId,
      new UserTypeValue(userType),
      now,
      now
    );
  }

  static reconstruct(
    id: string,
    userId: string,
    companyId: string,
    userType: number,
    createdAt: Date,
    updatedAt: Date
  ): UserCompany {
    return new UserCompany(
      id,
      userId,
      companyId,
      UserTypeValue.fromNumber(userType),
      createdAt,
      updatedAt
    );
  }

  isAdministrator(): boolean {
    return this.userType.isAdministrator();
  }
}

