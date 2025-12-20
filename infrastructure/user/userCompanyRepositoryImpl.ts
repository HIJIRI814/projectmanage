import { IUserCompanyRepository } from '~domain/user/repository/IUserCompanyRepository';
import { UserCompany } from '~domain/user/model/UserCompany';
import { prismaClient } from '../prisma/prismaClient';

export class UserCompanyRepositoryImpl implements IUserCompanyRepository {
  async findByUserId(userId: string): Promise<UserCompany[]> {
    const userCompaniesData = await prismaClient.userCompany.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return userCompaniesData.map((userCompanyData) =>
      UserCompany.reconstruct(
        userCompanyData.id,
        userCompanyData.userId,
        userCompanyData.companyId,
        userCompanyData.userType,
        userCompanyData.createdAt,
        userCompanyData.updatedAt
      )
    );
  }

  async findByCompanyId(companyId: string): Promise<UserCompany[]> {
    const userCompaniesData = await prismaClient.userCompany.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return userCompaniesData.map((userCompanyData) =>
      UserCompany.reconstruct(
        userCompanyData.id,
        userCompanyData.userId,
        userCompanyData.companyId,
        userCompanyData.userType,
        userCompanyData.createdAt,
        userCompanyData.updatedAt
      )
    );
  }

  async findByUserIdAndCompanyId(userId: string, companyId: string): Promise<UserCompany | null> {
    const userCompanyData = await prismaClient.userCompany.findUnique({
      where: {
        userId_companyId: {
          userId,
          companyId,
        },
      },
    });

    if (!userCompanyData) {
      return null;
    }

    return UserCompany.reconstruct(
      userCompanyData.id,
      userCompanyData.userId,
      userCompanyData.companyId,
      userCompanyData.userType,
      userCompanyData.createdAt,
      userCompanyData.updatedAt
    );
  }

  async save(userCompany: UserCompany): Promise<UserCompany> {
    const userCompanyData = await prismaClient.userCompany.upsert({
      where: {
        userId_companyId: {
          userId: userCompany.userId,
          companyId: userCompany.companyId,
        },
      },
      update: {
        userType: userCompany.userType.toNumber(),
        updatedAt: new Date(),
      },
      create: {
        id: userCompany.id,
        userId: userCompany.userId,
        companyId: userCompany.companyId,
        userType: userCompany.userType.toNumber(),
        createdAt: userCompany.createdAt,
        updatedAt: userCompany.updatedAt,
      },
    });

    return UserCompany.reconstruct(
      userCompanyData.id,
      userCompanyData.userId,
      userCompanyData.companyId,
      userCompanyData.userType,
      userCompanyData.createdAt,
      userCompanyData.updatedAt
    );
  }

  async delete(id: string): Promise<void> {
    await prismaClient.userCompany.delete({
      where: { id },
    });
  }
}

