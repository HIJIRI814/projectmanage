import { CreateUser } from '../../user/useCases/CreateUser';
import { CreateUserInput } from '../../user/dto/CreateUserInput';
import { UserOutput } from '../../user/dto/UserOutput';

export class SignUp {
  constructor(private createUserUseCase: CreateUser) {}

  async execute(input: SignUpInput): Promise<UserOutput> {
    const createUserInput = new CreateUserInput(input.email, input.password, input.name);
    return await this.createUserUseCase.execute(createUserInput);
  }
}

