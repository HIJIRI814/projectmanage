import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { UserType } from '../domain/user/model/UserType';
import { ProjectVisibility } from '../domain/project/model/ProjectVisibility';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 会社を作成
  const company1 = await prisma.company.upsert({
    where: { id: 'company-1' },
    update: {},
    create: {
      id: 'company-1',
      name: 'テスト会社1',
    },
  });

  const company2 = await prisma.company.upsert({
    where: { id: 'company-2' },
    update: {},
    create: {
      id: 'company-2',
      name: 'テスト会社2',
    },
  });

  console.log('Created companies:', company1, company2);

  // ユーザーを作成
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: hashedPassword,
      name: '管理者ユーザー',
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: {
      email: 'member@example.com',
      passwordHash: hashedPassword,
      name: 'メンバーユーザー',
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      passwordHash: hashedPassword,
      name: '顧客ユーザー',
    },
  });

  console.log('Created users:', adminUser, memberUser, customerUser);

  // UserCompanyを作成
  const adminUserCompany = await prisma.userCompany.upsert({
    where: {
      userId_companyId: {
        userId: adminUser.id,
        companyId: company1.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      companyId: company1.id,
      userType: UserType.ADMINISTRATOR,
    },
  });

  const memberUserCompany = await prisma.userCompany.upsert({
    where: {
      userId_companyId: {
        userId: memberUser.id,
        companyId: company1.id,
      },
    },
    update: {},
    create: {
      userId: memberUser.id,
      companyId: company1.id,
      userType: UserType.MEMBER,
    },
  });

  const customerUserCompany = await prisma.userCompany.upsert({
    where: {
      userId_companyId: {
        userId: customerUser.id,
        companyId: company1.id,
      },
    },
    update: {},
    create: {
      userId: customerUser.id,
      companyId: company1.id,
      userType: UserType.CUSTOMER,
    },
  });

  // 管理者ユーザーを会社2にも追加（複数会社所属のテスト用）
  const adminUserCompany2 = await prisma.userCompany.upsert({
    where: {
      userId_companyId: {
        userId: adminUser.id,
        companyId: company2.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      companyId: company2.id,
      userType: UserType.MEMBER, // 会社2ではメンバー
    },
  });

  console.log('Created userCompanies:', adminUserCompany, memberUserCompany, customerUserCompany, adminUserCompany2);

  // プロジェクトを作成
  const privateProject = await prisma.project.create({
    data: {
      name: 'プライベートプロジェクト',
      description: 'プライベートなプロジェクトです',
      visibility: ProjectVisibility.PRIVATE,
      members: {
        create: {
          userId: adminUser.id,
        },
      },
    },
  });

  const companyInternalProject = await prisma.project.create({
    data: {
      name: '社内公開プロジェクト',
      description: '社内公開のプロジェクトです',
      visibility: ProjectVisibility.COMPANY_INTERNAL,
      members: {
        create: {
          userId: adminUser.id,
        },
      },
      projectCompanies: {
        create: {
          companyId: company1.id,
        },
      },
    },
  });

  const publicProject = await prisma.project.create({
    data: {
      name: '公開プロジェクト',
      description: '公開プロジェクトです',
      visibility: ProjectVisibility.PUBLIC,
      members: {
        create: {
          userId: adminUser.id,
        },
      },
      projectCompanies: {
        create: [
          { companyId: company1.id },
          { companyId: company2.id },
        ],
      },
    },
  });

  console.log('Created projects:', privateProject, companyInternalProject, publicProject);

  // シートを作成
  const sheet1 = await prisma.sheet.create({
    data: {
      projectId: privateProject.id,
      name: 'テストシート1',
      description: 'プライベートプロジェクトのシート',
      content: '{"cells": []}',
      imageUrl: '/uploads/sheets/test1.png',
    },
  });

  const sheet2 = await prisma.sheet.create({
    data: {
      projectId: companyInternalProject.id,
      name: 'テストシート2',
      description: '社内公開プロジェクトのシート',
      content: '{"cells": []}',
      imageUrl: '/uploads/sheets/test2.png',
    },
  });

  console.log('Created sheets:', sheet1, sheet2);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

