import { IUserRepository } from '~domain/user/model/IUserRepository';
import { User } from '~domain/user/model/User';
import { Email } from '~domain/user/model/Email';
import { PasswordHash } from '~domain/user/model/PasswordHash';
import { UpdateUserInput } from '../dto/UpdateUserInput';
import { UserOutput } from '../dto/UserOutput';
import { UserType } from '~domain/user/model/UserType';

export class UpdateUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(
    userId: string,
    input: UpdateUserInput,
    currentUserId: string
  ): Promise<UserOutput> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // メールアドレスの重複チェック（自分以外）
    if (input.email) {
      const email = new Email(input.email);
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email already exists');
      }
    }

    // パスワードの更新
    let passwordHash = user.passwordHash;
    if (input.password) {
      passwordHash = await PasswordHash.create(input.password);
    }

    // ユーザー情報の更新
    const updatedUser = User.reconstruct(
      user.id,
      input.email || user.email.toString(),
      passwordHash.toString(),
      input.name || user.name,
      user.createdAt,
      new Date()
    );

    const savedUser = await this.userRepository.save(updatedUser);

    // UserOutputにはuserTypeが必要だが、UserCompanyで管理するため、デフォルト値としてCUSTOMERを返す
    // 実際のuserTypeはUserCompanyから取得する必要がある
    return new UserOutput(
      savedUser.id,
      savedUser.email.toString(),
      savedUser.name,
      UserType.CUSTOMER, // デフォルト値（実際のuserTypeはUserCompanyから取得）
      savedUser.createdAt,
      savedUser.updatedAt
    );
  }
}

