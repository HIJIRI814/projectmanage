import { ICompanyRepository } from '~domain/company/repository/ICompanyRepository';
import { CompanyOutput } from '../dto/CompanyOutput';

export class GetCompany {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(id: string): Promise<CompanyOutput | null> {
    const company = await this.companyRepository.findById(id);

    if (!company) {
      return null;
    }

    return new CompanyOutput(company.id, company.name, company.createdAt, company.updatedAt);
  }
}

