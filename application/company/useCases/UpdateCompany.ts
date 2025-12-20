import { ICompanyRepository } from '~domain/company/repository/ICompanyRepository';
import { Company } from '~domain/company/model/Company';
import { UpdateCompanyInput } from '../dto/UpdateCompanyInput';
import { CompanyOutput } from '../dto/CompanyOutput';

export class UpdateCompany {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(id: string, input: UpdateCompanyInput): Promise<CompanyOutput | null> {
    const existingCompany = await this.companyRepository.findById(id);

    if (!existingCompany) {
      return null;
    }

    const updatedCompany = Company.reconstruct(
      existingCompany.id,
      input.name,
      existingCompany.createdAt,
      new Date()
    );

    const savedCompany = await this.companyRepository.save(updatedCompany);

    return new CompanyOutput(
      savedCompany.id,
      savedCompany.name,
      savedCompany.createdAt,
      savedCompany.updatedAt
    );
  }
}

