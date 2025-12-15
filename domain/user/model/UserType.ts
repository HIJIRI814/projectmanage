export enum UserType {
  ADMINISTRATOR = 1,
  MEMBER = 2,
  PARTNER = 3,
  CUSTOMER = 4,
}

export const UserTypeLabel: Record<UserType, string> = {
  [UserType.ADMINISTRATOR]: '管理者',
  [UserType.MEMBER]: 'メンバー',
  [UserType.PARTNER]: 'パートナー',
  [UserType.CUSTOMER]: '顧客',
};

export class UserTypeValue {
  private readonly value: UserType;

  constructor(value: UserType) {
    if (!Object.values(UserType).includes(value)) {
      throw new Error('Invalid user type');
    }
    this.value = value;
  }

  static fromNumber(value: number): UserTypeValue {
    if (!Object.values(UserType).includes(value as UserType)) {
      throw new Error('Invalid user type');
    }
    return new UserTypeValue(value as UserType);
  }

  toNumber(): number {
    return this.value;
  }

  getLabel(): string {
    return UserTypeLabel[this.value];
  }

  equals(other: UserTypeValue): boolean {
    return this.value === other.value;
  }

  isAdministrator(): boolean {
    return this.value === UserType.ADMINISTRATOR;
  }
}



