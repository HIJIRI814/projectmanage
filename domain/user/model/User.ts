import { Email } from './Email';
import { PasswordHash } from './PasswordHash';
import { UserType, UserTypeValue } from './UserType';

export class User {
  private constructor(
    public readonly id: string,
    public readonly email: Email,
    public readonly passwordHash: PasswordHash,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static async create(
    id: string,
    email: Email,
    plainPassword: string,
    name: string
  ): Promise<User> {
    const passwordHash = await PasswordHash.create(plainPassword);
    const now = new Date();
    return new User(id, email, passwordHash, name, now, now);
  }

  static reconstruct(
    id: string,
    email: string,
    hashedPassword: string,
    name: string,
    createdAt: Date,
    updatedAt: Date
  ): User {
    return new User(
      id,
      new Email(email),
      PasswordHash.fromHash(hashedPassword),
      name,
      createdAt,
      updatedAt
    );
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    return await this.passwordHash.verify(plainPassword);
  }

  // 会社でのユーザータイプを取得するメソッド（UserCompanyから取得する必要があるため、ここではシグネチャのみ）
  // 実際の実装はリポジトリ層で行う
  getUserTypeInCompany(companyId: string): UserTypeValue | null {
    // このメソッドはUserCompanyリポジトリから取得する必要があるため、
    // ここではnullを返す（実際の実装はアプリケーション層で行う）
    return null;
  }
}

