export class InvitationOutput {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly companyName?: string,
    public readonly email: string,
    public readonly token: string,
    public readonly userType: number,
    public readonly status: string,
    public readonly invitedBy: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}

