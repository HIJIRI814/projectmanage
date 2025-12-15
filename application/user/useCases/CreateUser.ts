import { IUserRepository } from '../../../domain/user/model/IUserRepository';
import { User } from '../../../domain/user/model/User';
import { Email } from '../../../domain/user/model/Email';
import { CreateUserInput } from '../dto/CreateUserInput';
import { UserOutput } from '../dto/UserOutput';
import { v4 as uuidv4 } from 'uuid';

export class CreateUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<UserOutput> {
    const email = new Email(input.email);
    
    // メールアドレスの重複チェック
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    const user = await User.create(
      uuidv4(),
      email,
      input.password,
      input.name,
      input.userType
    );

    const savedUser = await this.userRepository.save(user);

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



