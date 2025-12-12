import { User } from '../model/User';
import { Email } from '../model/Email';

export class AuthDomainService {
  async authenticateUser(user: User, plainPassword: string): Promise<boolean> {
    return await user.verifyPassword(plainPassword);
  }

  isEmailValid(email: Email): boolean {
    // ドメイン固有のバリデーションロジック
    return email.toString().length > 0;
  }
}

