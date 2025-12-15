import { ICompanyRepository } from '../../../domain/company/repository/ICompanyRepository';

export class DeleteCompany {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(id: string): Promise<void> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new Error('Company not found');
    }

    await this.companyRepository.delete(id);
  }
}

