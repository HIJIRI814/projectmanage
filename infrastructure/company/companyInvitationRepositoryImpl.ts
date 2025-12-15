import { ICompanyInvitationRepository } from '../../domain/company/repository/ICompanyInvitationRepository';
import { CompanyInvitation } from '../../domain/company/model/CompanyInvitation';
import { InvitationStatus } from '../../domain/company/model/InvitationStatus';
import { prismaClient } from '../prisma/prismaClient';

export class CompanyInvitationRepositoryImpl implements ICompanyInvitationRepository {
  async findById(id: string): Promise<CompanyInvitation | null> {
    const invitationData = await prismaClient.companyInvitation.findUnique({
      where: { id },
    });

    if (!invitationData) {
      return null;
    }

    return CompanyInvitation.reconstruct(
      invitationData.id,
      invitationData.companyId,
      invitationData.email,
      invitationData.token,
      invitationData.userType,
      invitationData.status as InvitationStatus,
      invitationData.invitedBy,
      invitationData.expiresAt,
      invitationData.createdAt,
      invitationData.updatedAt
    );
  }

  async findByToken(token: string): Promise<CompanyInvitation | null> {
    const invitationData = await prismaClient.companyInvitation.findUnique({
      where: { token },
    });

    if (!invitationData) {
      return null;
    }

    return CompanyInvitation.reconstruct(
      invitationData.id,
      invitationData.companyId,
      invitationData.email,
      invitationData.token,
      invitationData.userType,
      invitationData.status as InvitationStatus,
      invitationData.invitedBy,
      invitationData.expiresAt,
      invitationData.createdAt,
      invitationData.updatedAt
    );
  }

  async findByCompanyIdAndEmail(
    companyId: string,
    email: string,
    status?: InvitationStatus
  ): Promise<CompanyInvitation | null> {
    const where: any = {
      companyId,
      email,
    };

    if (status) {
      where.status = status;
    }

    const invitationData = await prismaClient.companyInvitation.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (!invitationData) {
      return null;
    }

    return CompanyInvitation.reconstruct(
      invitationData.id,
      invitationData.companyId,
      invitationData.email,
      invitationData.token,
      invitationData.userType,
      invitationData.status as InvitationStatus,
      invitationData.invitedBy,
      invitationData.expiresAt,
      invitationData.createdAt,
      invitationData.updatedAt
    );
  }

  async findByCompanyId(companyId: string): Promise<CompanyInvitation[]> {
    const invitationsData = await prismaClient.companyInvitation.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return invitationsData.map((invitationData) =>
      CompanyInvitation.reconstruct(
        invitationData.id,
        invitationData.companyId,
        invitationData.email,
        invitationData.token,
        invitationData.userType,
        invitationData.status as InvitationStatus,
        invitationData.invitedBy,
        invitationData.expiresAt,
        invitationData.createdAt,
        invitationData.updatedAt
      )
    );
  }

  async save(invitation: CompanyInvitation): Promise<CompanyInvitation> {
    const invitationData = await prismaClient.companyInvitation.upsert({
      where: { id: invitation.id },
      update: {
        companyId: invitation.companyId,
        email: invitation.email,
        token: invitation.token,
        userType: invitation.userType,
        status: invitation.status,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
        updatedAt: invitation.updatedAt,
      },
      create: {
        id: invitation.id,
        companyId: invitation.companyId,
        email: invitation.email,
        token: invitation.token,
        userType: invitation.userType,
        status: invitation.status,
        invitedBy: invitation.invitedBy,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
      },
    });

    return CompanyInvitation.reconstruct(
      invitationData.id,
      invitationData.companyId,
      invitationData.email,
      invitationData.token,
      invitationData.userType,
      invitationData.status as InvitationStatus,
      invitationData.invitedBy,
      invitationData.expiresAt,
      invitationData.createdAt,
      invitationData.updatedAt
    );
  }
}

