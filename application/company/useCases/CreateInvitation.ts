import { ICompanyInvitationRepository } from '../../../domain/company/repository/ICompanyInvitationRepository';
import { CompanyInvitation } from '../../../domain/company/model/CompanyInvitation';
import { InvitationStatus } from '../../../domain/company/model/InvitationStatus';
import { CreateInvitationInput } from '../dto/CreateInvitationInput';
import { InvitationOutput } from '../dto/InvitationOutput';

export class CreateInvitation {
  constructor(private invitationRepository: ICompanyInvitationRepository) {}

  async execute(input: CreateInvitationInput, invitedBy: string): Promise<InvitationOutput> {
    // 同じ会社・メールアドレスでPENDINGの招待が既に存在するかチェック
    const existing = await this.invitationRepository.findByCompanyIdAndEmail(
      input.companyId,
      input.email,
      InvitationStatus.PENDING
    );

    if (existing) {
      throw new Error('A pending invitation already exists for this email in this company');
    }

    const invitation = CompanyInvitation.create(
      input.companyId,
      input.email,
      input.userType,
      invitedBy
    );

    const savedInvitation = await this.invitationRepository.save(invitation);

    return new InvitationOutput(
      savedInvitation.id,
      savedInvitation.companyId,
      undefined, // companyNameは必要に応じて後で取得
      savedInvitation.email,
      savedInvitation.token,
      savedInvitation.userType,
      savedInvitation.status,
      savedInvitation.invitedBy,
      savedInvitation.expiresAt,
      savedInvitation.createdAt,
      savedInvitation.updatedAt
    );
  }
}

