import { ICompanyInvitationRepository } from '../../../domain/company/repository/ICompanyInvitationRepository';
import { ICompanyRepository } from '../../../domain/company/repository/ICompanyRepository';
import { InvitationOutput } from '../dto/InvitationOutput';

export class GetInvitationByToken {
  constructor(
    private invitationRepository: ICompanyInvitationRepository,
    private companyRepository: ICompanyRepository
  ) {}

  async execute(token: string): Promise<InvitationOutput | null> {
    const invitation = await this.invitationRepository.findByToken(token);

    if (!invitation) {
      return null;
    }

    // 会社名を取得
    const company = await this.companyRepository.findById(invitation.companyId);
    const companyName = company?.name;

    return new InvitationOutput(
      invitation.id,
      invitation.companyId,
      companyName,
      invitation.email,
      invitation.token,
      invitation.userType,
      invitation.status,
      invitation.invitedBy,
      invitation.expiresAt,
      invitation.createdAt,
      invitation.updatedAt
    );
  }
}

