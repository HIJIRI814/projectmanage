import { Email } from './Email';
import { PasswordHash } from './PasswordHash';
import { UserType, UserTypeValue } from './UserType';

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly passwordHash: PasswordHash,
    public readonly name: string,
    public readonly userType: UserTypeValue,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static async create(
    id: string,
    email: Email,
    plainPassword: string,
    name: string,
    userType: UserType = UserType.CUSTOMER
  ): Promise<User> {
    const passwordHash = await PasswordHash.create(plainPassword);
    const now = new Date();
    return new User(
      id,
      email,
      passwordHash,
      name,
      new UserTypeValue(userType),
      now,
      now
    );
  }

  static reconstruct(
    id: string,
    email: string,
    hashedPassword: string,
    name: string,
    userType: number,
    createdAt: Date,
    updatedAt: Date
  ): User {
    return new User(
      id,
      new Email(email),
      PasswordHash.fromHash(hashedPassword),
      name,
      UserTypeValue.fromNumber(userType),
      createdAt,
      updatedAt
    );
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    return await this.passwordHash.verify(plainPassword);
  }

  isAdministrator(): boolean {
    return this.userType.isAdministrator();
  }
}

