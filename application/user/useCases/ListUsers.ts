import { IUserRepository } from '../../../domain/user/model/IUserRepository';
import { UserOutput } from '../dto/UserOutput';

export class ListUsers {
  constructor(private userRepository: IUserRepository) {}

  async execute(): Promise<UserOutput[]> {
    const users = await this.userRepository.findAll();

    return users.map(
      (user) =>
        new UserOutput(
          user.id,
          user.email.toString(),
          user.name,
          user.userType.toNumber(),
          user.createdAt,
          user.updatedAt
        )
    );
  }
}

