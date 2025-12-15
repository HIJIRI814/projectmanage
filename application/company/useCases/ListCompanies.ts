import { ICompanyRepository } from '../../../domain/company/repository/ICompanyRepository';
import { CompanyOutput } from '../dto/CompanyOutput';

export class ListCompanies {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(): Promise<CompanyOutput[]> {
    const companies = await this.companyRepository.findAll();

    return companies.map(
      (company) =>
        new CompanyOutput(company.id, company.name, company.createdAt, company.updatedAt)
    );
  }
}

