import { ICompanyPartnershipRepository } from '../../domain/company/repository/ICompanyPartnershipRepository';
import { CompanyPartnership } from '../../domain/company/model/CompanyPartnership';
import { prismaClient } from '../prisma/prismaClient';
import { v4 as uuidv4 } from 'uuid';

export class CompanyPartnershipRepositoryImpl implements ICompanyPartnershipRepository {
  async findByCompanyId(companyId: string): Promise<CompanyPartnership[]> {
    const partnerships = await prismaClient.companyPartnership.findMany({
      where: {
        OR: [
          { companyId1: companyId },
          { companyId2: companyId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return partnerships.map((p) =>
      CompanyPartnership.reconstruct(p.id, p.companyId1, p.companyId2, p.createdAt)
    );
  }

  async create(companyId1: string, companyId2: string): Promise<CompanyPartnership> {
    // companyId1 < companyId2 で順序を固定
    const [sortedId1, sortedId2] = companyId1 < companyId2 
      ? [companyId1, companyId2] 
      : [companyId2, companyId1];

    const partnership = await prismaClient.companyPartnership.create({
      data: {
        id: uuidv4(),
        companyId1: sortedId1,
        companyId2: sortedId2,
      },
    });

    return CompanyPartnership.reconstruct(
      partnership.id,
      partnership.companyId1,
      partnership.companyId2,
      partnership.createdAt
    );
  }

  async exists(companyId1: string, companyId2: string): Promise<boolean> {
    // companyId1 < companyId2 で順序を固定
    const [sortedId1, sortedId2] = companyId1 < companyId2 
      ? [companyId1, companyId2] 
      : [companyId2, companyId1];

    const partnership = await prismaClient.companyPartnership.findUnique({
      where: {
        companyId1_companyId2: {
          companyId1: sortedId1,
          companyId2: sortedId2,
        },
      },
    });

    return partnership !== null;
  }
}


