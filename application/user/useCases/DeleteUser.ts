import { IUserRepository } from '~domain/user/model/IUserRepository';

export class DeleteUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, currentUserId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // ビジネスルール: 管理者は自分自身を削除できない
    if (currentUserId === userId) {
      throw new Error('管理者は自分自身を削除できません');
    }

    await this.userRepository.delete(userId);
  }
}

