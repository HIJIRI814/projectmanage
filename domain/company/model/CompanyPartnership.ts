export class CompanyPartnership {
  private constructor(
    public readonly id: string,
    public readonly companyId1: string,
    public readonly companyId2: string,
    public readonly createdAt: Date
  ) {}

  static create(id: string, companyId1: string, companyId2: string): CompanyPartnership {
    // companyId1 < companyId2 で順序を固定
    const [sortedId1, sortedId2] = companyId1 < companyId2 
      ? [companyId1, companyId2] 
      : [companyId2, companyId1];
    
    return new CompanyPartnership(id, sortedId1, sortedId2, new Date());
  }

  static reconstruct(
    id: string,
    companyId1: string,
    companyId2: string,
    createdAt: Date
  ): CompanyPartnership {
    return new CompanyPartnership(id, companyId1, companyId2, createdAt);
  }

  getPartnerCompanyId(currentCompanyId: string): string {
    return this.companyId1 === currentCompanyId ? this.companyId2 : this.companyId1;
  }
}

