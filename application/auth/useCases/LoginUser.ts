import { IUserRepository } from '../../../domain/user/model/IUserRepository';
import { IUserCompanyRepository } from '../../../domain/user/repository/IUserCompanyRepository';
import { Email } from '../../../domain/user/model/Email';
import { AuthDomainService } from '../../../domain/user/service/AuthDomainService';
import { JwtService } from '../../../infrastructure/auth/jwtService';
import { LoginInput } from '../dto/LoginInput';
import { AuthResult } from '../dto/AuthResult';

export class LoginUser {
  constructor(
    private userRepository: IUserRepository,
    private userCompanyRepository: IUserCompanyRepository,
    private authDomainService: AuthDomainService,
    private jwtService: JwtService
  ) {}

  async execute(input: LoginInput): Promise<AuthResult> {
    // ドメインオブジェクトの作成
    const email = new Email(input.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // ドメインサービスを使用して認証
    const isAuthenticated = await this.authDomainService.authenticateUser(
      user,
      input.password
    );

    if (!isAuthenticated) {
      throw new Error('Invalid credentials');
    }

    // UserCompanyからuserTypeを取得（最初の会社のuserTypeを使用）
    const userCompanies = await this.userCompanyRepository.findByUserId(user.id);
    const userType = userCompanies.length > 0 ? userCompanies[0].userType.toNumber() : null;

    // JWT トークンの発行
    const accessToken = this.jwtService.generateAccessToken(user.id);
    const refreshToken = this.jwtService.generateRefreshToken(user.id);

    return new AuthResult(accessToken, refreshToken, {
      id: user.id,
      email: user.email.toString(),
      name: user.name,
      userType,
    });
  }
}

