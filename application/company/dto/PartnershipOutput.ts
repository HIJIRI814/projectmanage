export class PartnershipOutput {
  constructor(
    public readonly id: string,
    public readonly partnerCompanyId: string,
    public readonly partnerCompanyName: string,
    public readonly createdAt: Date
  ) {}
}

