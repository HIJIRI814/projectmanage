import { InvitationStatus } from './InvitationStatus';
import { v4 as uuidv4 } from 'uuid';

export class CompanyInvitation {
  private constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly email: string,
    public readonly token: string,
    public readonly userType: number,
    public readonly status: InvitationStatus,
    public readonly invitedBy: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    companyId: string,
    email: string,
    userType: number,
    invitedBy: string,
    expiresInDays: number = 7
  ): CompanyInvitation {
    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return new CompanyInvitation(
      uuidv4(),
      companyId,
      email,
      uuidv4(), // トークン生成
      userType,
      InvitationStatus.PENDING,
      invitedBy,
      expiresAt,
      now,
      now
    );
  }

  static reconstruct(
    id: string,
    companyId: string,
    email: string,
    token: string,
    userType: number,
    status: InvitationStatus,
    invitedBy: string,
    expiresAt: Date,
    createdAt: Date,
    updatedAt: Date
  ): CompanyInvitation {
    return new CompanyInvitation(
      id,
      companyId,
      email,
      token,
      userType,
      status,
      invitedBy,
      expiresAt,
      createdAt,
      updatedAt
    );
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isPending(): boolean {
    return this.status === InvitationStatus.PENDING;
  }

  isAccepted(): boolean {
    return this.status === InvitationStatus.ACCEPTED;
  }

  canBeAccepted(): boolean {
    return this.isPending() && !this.isExpired();
  }

  accept(): CompanyInvitation {
    if (!this.canBeAccepted()) {
      throw new Error('Invitation cannot be accepted');
    }

    return new CompanyInvitation(
      this.id,
      this.companyId,
      this.email,
      this.token,
      this.userType,
      InvitationStatus.ACCEPTED,
      this.invitedBy,
      this.expiresAt,
      this.createdAt,
      new Date()
    );
  }

  reject(): CompanyInvitation {
    if (!this.isPending()) {
      throw new Error('Only pending invitations can be rejected');
    }

    return new CompanyInvitation(
      this.id,
      this.companyId,
      this.email,
      this.token,
      this.userType,
      InvitationStatus.REJECTED,
      this.invitedBy,
      this.expiresAt,
      this.createdAt,
      new Date()
    );
  }

  expire(): CompanyInvitation {
    if (this.status !== InvitationStatus.PENDING) {
      throw new Error('Only pending invitations can be expired');
    }

    return new CompanyInvitation(
      this.id,
      this.companyId,
      this.email,
      this.token,
      this.userType,
      InvitationStatus.EXPIRED,
      this.invitedBy,
      this.expiresAt,
      this.createdAt,
      new Date()
    );
  }
}

