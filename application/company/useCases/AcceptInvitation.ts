import { ICompanyInvitationRepository } from '../../../domain/company/repository/ICompanyInvitationRepository';
import { IUserCompanyRepository } from '../../../domain/user/repository/IUserCompanyRepository';
import { IUserRepository } from '../../../domain/user/model/IUserRepository';
import { Email } from '../../../domain/user/model/Email';
import { UserCompany } from '../../../domain/user/model/UserCompany';
import { AcceptInvitationInput } from '../dto/AcceptInvitationInput';
import { v4 as uuidv4 } from 'uuid';

export class AcceptInvitation {
  constructor(
    private invitationRepository: ICompanyInvitationRepository,
    private userCompanyRepository: IUserCompanyRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(input: AcceptInvitationInput): Promise<void> {
    // トークンから招待を取得
    const invitation = await this.invitationRepository.findByToken(input.token);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // 有効期限チェック
    if (invitation.isExpired()) {
      throw new Error('Invitation has expired');
    }

    // 承認可能かチェック
    if (!invitation.canBeAccepted()) {
      throw new Error('Invitation cannot be accepted');
    }

    // ユーザーが既に登録されているかチェック
    const email = new Email(invitation.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error('User not found. Please sign up first.');
    }

    // ユーザーIDが一致するかチェック
    if (user.id !== input.userId) {
      throw new Error('User ID does not match invitation email');
    }

    // 既にその会社に所属しているかチェック
    const existingUserCompany = await this.userCompanyRepository.findByUserIdAndCompanyId(
      input.userId,
      invitation.companyId
    );

    if (existingUserCompany) {
      throw new Error('User is already a member of this company');
    }

    // UserCompanyを作成
    const userCompany = UserCompany.create(
      uuidv4(),
      input.userId,
      invitation.companyId,
      invitation.userType
    );

    await this.userCompanyRepository.save(userCompany);

    // 招待ステータスをACCEPTEDに更新
    const acceptedInvitation = invitation.accept();
    await this.invitationRepository.save(acceptedInvitation);
  }
}

