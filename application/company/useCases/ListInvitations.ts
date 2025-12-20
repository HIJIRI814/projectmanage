import { ICompanyInvitationRepository } from '~domain/company/repository/ICompanyInvitationRepository';
import { InvitationOutput } from '../dto/InvitationOutput';

export class ListInvitations {
  constructor(private invitationRepository: ICompanyInvitationRepository) {}

  async execute(companyId: string): Promise<InvitationOutput[]> {
    const invitations = await this.invitationRepository.findByCompanyId(companyId);

    return invitations.map(
      (invitation) =>
        new InvitationOutput(
          invitation.id,
          invitation.companyId,
          undefined, // companyNameは必要に応じて後で取得
          invitation.email,
          invitation.token,
          invitation.userType,
          invitation.status,
          invitation.invitedBy,
          invitation.expiresAt,
          invitation.createdAt,
          invitation.updatedAt
        )
    );
  }
}

