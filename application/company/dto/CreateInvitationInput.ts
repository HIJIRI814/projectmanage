export class CreateInvitationInput {
  constructor(
    public readonly companyId: string,
    public readonly email: string,
    public readonly userType: number
  ) {}
}

