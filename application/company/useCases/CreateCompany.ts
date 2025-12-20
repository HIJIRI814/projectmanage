import { ICompanyRepository } from '~domain/company/repository/ICompanyRepository';
import { Company } from '~domain/company/model/Company';
import { CreateCompanyInput } from '../dto/CreateCompanyInput';
import { CompanyOutput } from '../dto/CompanyOutput';
import { v4 as uuidv4 } from 'uuid';

export class CreateCompany {
  constructor(private companyRepository: ICompanyRepository) {}

  async execute(input: CreateCompanyInput): Promise<CompanyOutput> {
    const company = Company.create(uuidv4(), input.name);

    const savedCompany = await this.companyRepository.save(company);

    return new CompanyOutput(
      savedCompany.id,
      savedCompany.name,
      savedCompany.createdAt,
      savedCompany.updatedAt
    );
  }
}

