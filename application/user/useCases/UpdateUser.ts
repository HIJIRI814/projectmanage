import { IUserRepository } from '../../../domain/user/model/IUserRepository';
import { User } from '../../../domain/user/model/User';
import { Email } from '../../../domain/user/model/Email';
import { PasswordHash } from '../../../domain/user/model/PasswordHash';
import { UserTypeValue, UserType } from '../../../domain/user/model/UserType';
import { UpdateUserInput } from '../dto/UpdateUserInput';
import { UserOutput } from '../dto/UserOutput';

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

    // ビジネスルール: 管理者は自分自身の種別を変更できない
    if (currentUserId === userId && input.userType !== undefined) {
      if (user.isAdministrator() && input.userType !== UserType.ADMINISTRATOR) {
        throw new Error('管理者は自分自身のユーザー種別を変更できません');
      }
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

    // ユーザー種別の更新
    let userType = user.userType;
    if (input.userType !== undefined) {
      userType = UserTypeValue.fromNumber(input.userType);
    }

    // ユーザー情報の更新
    const updatedUser = User.reconstruct(
      user.id,
      input.email || user.email.toString(),
      passwordHash.toString(),
      input.name || user.name,
      userType.toNumber(),
      user.createdAt,
      new Date()
    );

    const savedUser = await this.userRepository.save(updatedUser);

    return new UserOutput(
      savedUser.id,
      savedUser.email.toString(),
      savedUser.name,
      savedUser.userType.toNumber(),
      savedUser.createdAt,
      savedUser.updatedAt
    );
  }
}

