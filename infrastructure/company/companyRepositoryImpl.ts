import { ICompanyRepository } from '~domain/company/repository/ICompanyRepository';
import { Company } from '~domain/company/model/Company';
import { prismaClient } from '../prisma/prismaClient';

export class CompanyRepositoryImpl implements ICompanyRepository {
  async findById(id: string): Promise<Company | null> {
    const companyData = await prismaClient.company.findUnique({
      where: { id },
    });

    if (!companyData) {
      return null;
    }

    return Company.reconstruct(
      companyData.id,
      companyData.name,
      companyData.createdAt,
      companyData.updatedAt
    );
  }

  async findAll(): Promise<Company[]> {
    const companiesData = await prismaClient.company.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return companiesData.map((companyData) =>
      Company.reconstruct(
        companyData.id,
        companyData.name,
        companyData.createdAt,
        companyData.updatedAt
      )
    );
  }

  async save(company: Company): Promise<Company> {
    const companyData = await prismaClient.company.upsert({
      where: { id: company.id },
      update: {
        name: company.name,
        updatedAt: new Date(),
      },
      create: {
        id: company.id,
        name: company.name,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      },
    });

    return Company.reconstruct(
      companyData.id,
      companyData.name,
      companyData.createdAt,
      companyData.updatedAt
    );
  }

  async delete(id: string): Promise<void> {
    await prismaClient.company.delete({
      where: { id },
    });
  }
}

