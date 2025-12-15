import { CompanyInvitation } from '../model/CompanyInvitation';
import { InvitationStatus } from '../model/InvitationStatus';

export interface ICompanyInvitationRepository {
  save(invitation: CompanyInvitation): Promise<CompanyInvitation>;
  findById(id: string): Promise<CompanyInvitation | null>;
  findByToken(token: string): Promise<CompanyInvitation | null>;
  findByCompanyIdAndEmail(
    companyId: string,
    email: string,
    status?: InvitationStatus
  ): Promise<CompanyInvitation | null>;
  findByCompanyId(companyId: string): Promise<CompanyInvitation[]>;
}

