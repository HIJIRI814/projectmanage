export class UserCompanyOutput {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly companyId: string,
    public readonly userType: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}

