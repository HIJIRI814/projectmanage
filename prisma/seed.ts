import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { UserType } from '../domain/user/model/UserType';
import { ProjectVisibility } from '../domain/project/model/ProjectVisibility';
import { InvitationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// シード実行時はDIRECT_URLを使用（接続プーリングを回避）
const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directUrl,
    },
  },
});

async function main() {
  console.log('🗑️  Deleting all existing records...');

  // 外部キー制約を考慮して子から親の順に削除
  await prisma.sheetMarker.deleteMany();
  await prisma.sheetVersion.deleteMany();
  await prisma.sheet.deleteMany();
  await prisma.projectClient.deleteMany();
  await prisma.projectCompany.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.companyInvitation.deleteMany();
  await prisma.companyPartnership.deleteMany();
  await prisma.userCompany.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log('✅ All records deleted');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 会社を作成（4社）
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        id: 'company-1',
        name: '株式会社テック',
      },
    }),
    prisma.company.create({
      data: {
        id: 'company-2',
        name: 'デザインスタジオ',
      },
    }),
    prisma.company.create({
      data: {
        id: 'company-3',
        name: 'マーケティング代理店',
      },
    }),
    prisma.company.create({
      data: {
        id: 'company-4',
        name: 'クライアント企業',
      },
    }),
  ]);

  console.log(`✅ Created ${companies.length} companies`);

  // ユーザーを作成（各会社に複数のユーザー）
  const users = await Promise.all([
    // 会社1のユーザー
    prisma.user.create({
      data: {
        email: 'admin1@tech.com',
        passwordHash: hashedPassword,
        name: 'テック管理者',
      },
    }),
    prisma.user.create({
      data: {
        email: 'member1@tech.com',
        passwordHash: hashedPassword,
        name: 'テックメンバー1',
      },
    }),
    prisma.user.create({
      data: {
        email: 'member2@tech.com',
        passwordHash: hashedPassword,
        name: 'テックメンバー2',
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer1@tech.com',
        passwordHash: hashedPassword,
        name: 'テック顧客1',
      },
    }),
    // 会社2のユーザー
    prisma.user.create({
      data: {
        email: 'admin2@design.com',
        passwordHash: hashedPassword,
        name: 'デザイン管理者',
      },
    }),
    prisma.user.create({
      data: {
        email: 'member3@design.com',
        passwordHash: hashedPassword,
        name: 'デザインメンバー',
      },
    }),
    // 会社3のユーザー
    prisma.user.create({
      data: {
        email: 'admin3@marketing.com',
        passwordHash: hashedPassword,
        name: 'マーケティング管理者',
      },
    }),
    // 会社4のユーザー
    prisma.user.create({
      data: {
        email: 'customer2@client.com',
        passwordHash: hashedPassword,
        name: 'クライアントユーザー',
      },
    }),
    // 複数会社に所属するユーザー
    prisma.user.create({
      data: {
        email: 'multi@example.com',
        passwordHash: hashedPassword,
        name: '複数所属ユーザー',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // UserCompanyを作成
  const userCompanies = await Promise.all([
    // 会社1のユーザー
    prisma.userCompany.create({
      data: {
        userId: users[0].id,
        companyId: companies[0].id,
        userType: UserType.ADMINISTRATOR,
      },
    }),
    prisma.userCompany.create({
      data: {
        userId: users[1].id,
        companyId: companies[0].id,
        userType: UserType.MEMBER,
      },
    }),
    prisma.userCompany.create({
      data: {
        userId: users[2].id,
        companyId: companies[0].id,
        userType: UserType.MEMBER,
      },
    }),
    prisma.userCompany.create({
      data: {
        userId: users[3].id,
        companyId: companies[0].id,
        userType: UserType.CUSTOMER,
      },
    }),
    // 会社2のユーザー
    prisma.userCompany.create({
      data: {
        userId: users[4].id,
        companyId: companies[1].id,
        userType: UserType.ADMINISTRATOR,
      },
    }),
    prisma.userCompany.create({
      data: {
        userId: users[5].id,
        companyId: companies[1].id,
        userType: UserType.MEMBER,
      },
    }),
    // 会社3のユーザー
    prisma.userCompany.create({
      data: {
        userId: users[6].id,
        companyId: companies[2].id,
        userType: UserType.ADMINISTRATOR,
      },
    }),
    // 会社4のユーザー
    prisma.userCompany.create({
      data: {
        userId: users[7].id,
        companyId: companies[3].id,
        userType: UserType.CUSTOMER,
      },
    }),
    // 複数会社に所属するユーザー
    prisma.userCompany.create({
      data: {
        userId: users[8].id,
        companyId: companies[0].id,
        userType: UserType.MEMBER,
      },
    }),
    prisma.userCompany.create({
      data: {
        userId: users[8].id,
        companyId: companies[1].id,
        userType: UserType.MEMBER,
      },
    }),
  ]);

  console.log(`✅ Created ${userCompanies.length} userCompanies`);

  // 会社間のパートナーシップを作成
  const partnerships = [];
  
  // 会社1と会社2のパートナーシップ
  const [sortedId1, sortedId2] = companies[0].id < companies[1].id 
    ? [companies[0].id, companies[1].id] 
    : [companies[1].id, companies[0].id];
  partnerships.push(
    await prisma.companyPartnership.create({
      data: {
        companyId1: sortedId1,
        companyId2: sortedId2,
      },
    })
  );

  // 会社1と会社3のパートナーシップ
  const [sortedId1_3, sortedId3] = companies[0].id < companies[2].id 
    ? [companies[0].id, companies[2].id] 
    : [companies[2].id, companies[0].id];
  partnerships.push(
    await prisma.companyPartnership.create({
      data: {
        companyId1: sortedId1_3,
        companyId2: sortedId3,
      },
    })
  );

  console.log(`✅ Created ${partnerships.length} partnerships`);

  // プロジェクトを作成
  const projects = await Promise.all([
    // プライベートプロジェクト（会社1の管理者のみ）
    prisma.project.create({
      data: {
        name: 'プライベートプロジェクト1',
        description: '会社1のプライベートプロジェクト',
        visibility: ProjectVisibility.PRIVATE,
        members: {
          create: {
            userId: users[0].id,
          },
        },
      },
    }),
    // プライベートプロジェクト（複数メンバー）
    prisma.project.create({
      data: {
        name: 'プライベートプロジェクト2',
        description: '複数メンバーのプライベートプロジェクト',
        visibility: ProjectVisibility.PRIVATE,
        members: {
          create: [
            { userId: users[0].id },
            { userId: users[1].id },
            { userId: users[2].id },
          ],
        },
      },
    }),
    // 社内公開プロジェクト（会社1）
    prisma.project.create({
      data: {
        name: '社内公開プロジェクト1',
        description: '会社1の社内公開プロジェクト',
        visibility: ProjectVisibility.COMPANY_INTERNAL,
        members: {
          create: {
            userId: users[0].id,
          },
        },
        projectCompanies: {
          create: {
            companyId: companies[0].id,
          },
        },
      },
    }),
    // 社内公開プロジェクト（会社2）
    prisma.project.create({
      data: {
        name: '社内公開プロジェクト2',
        description: '会社2の社内公開プロジェクト',
        visibility: ProjectVisibility.COMPANY_INTERNAL,
        members: {
          create: {
            userId: users[4].id,
          },
        },
        projectCompanies: {
          create: {
            companyId: companies[1].id,
          },
        },
      },
    }),
    // 公開プロジェクト（複数会社）
    prisma.project.create({
      data: {
        name: '公開プロジェクト1',
        description: '会社1と会社2の公開プロジェクト',
        visibility: ProjectVisibility.PUBLIC,
        members: {
          create: {
            userId: users[0].id,
          },
        },
        projectCompanies: {
          create: [
            { companyId: companies[0].id },
            { companyId: companies[1].id },
          ],
        },
      },
    }),
    // 公開プロジェクト（3社）
    prisma.project.create({
      data: {
        name: '公開プロジェクト2',
        description: '3社共同の公開プロジェクト',
        visibility: ProjectVisibility.PUBLIC,
        members: {
          create: {
            userId: users[0].id,
          },
        },
        projectCompanies: {
          create: [
            { companyId: companies[0].id },
            { companyId: companies[1].id },
            { companyId: companies[2].id },
          ],
        },
      },
    }),
    // クライアント会社を持つプロジェクト
    prisma.project.create({
      data: {
        name: 'クライアントプロジェクト1',
        description: '会社4をクライアントに持つプロジェクト',
        visibility: ProjectVisibility.PRIVATE,
        members: {
          create: {
            userId: users[0].id,
          },
        },
      },
    }),
    // クライアント会社とプロジェクト会社の両方を持つプロジェクト
    prisma.project.create({
      data: {
        name: 'クライアントプロジェクト2',
        description: '会社1が運営、会社4がクライアント',
        visibility: ProjectVisibility.COMPANY_INTERNAL,
        members: {
          create: {
            userId: users[0].id,
          },
        },
        projectCompanies: {
          create: {
            companyId: companies[0].id,
          },
        },
      },
    }),
  ]);

  // プロジェクトクライアントを作成
  await prisma.projectClient.create({
    data: {
      projectId: projects[6].id,
      companyId: companies[3].id,
    },
  });

  await prisma.projectClient.create({
    data: {
      projectId: projects[7].id,
      companyId: companies[3].id,
    },
  });

  console.log(`✅ Created ${projects.length} projects`);

  // 会社招待を作成（様々なステータス）
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const invitations = await Promise.all([
    // 保留中の招待
    prisma.companyInvitation.create({
      data: {
        companyId: companies[0].id,
        email: 'pending@example.com',
        token: uuidv4(),
        userType: UserType.MEMBER,
        status: InvitationStatus.PENDING,
        invitedBy: users[0].id,
        expiresAt: tomorrow,
      },
    }),
    // 承認済みの招待
    prisma.companyInvitation.create({
      data: {
        companyId: companies[0].id,
        email: 'accepted@example.com',
        token: uuidv4(),
        userType: UserType.MEMBER,
        status: InvitationStatus.ACCEPTED,
        invitedBy: users[0].id,
        expiresAt: tomorrow,
      },
    }),
    // 拒否された招待
    prisma.companyInvitation.create({
      data: {
        companyId: companies[1].id,
        email: 'rejected@example.com',
        token: uuidv4(),
        userType: UserType.MEMBER,
        status: InvitationStatus.REJECTED,
        invitedBy: users[4].id,
        expiresAt: tomorrow,
      },
    }),
    // 期限切れの招待
    prisma.companyInvitation.create({
      data: {
        companyId: companies[2].id,
        email: 'expired@example.com',
        token: uuidv4(),
        userType: UserType.ADMINISTRATOR,
        status: InvitationStatus.EXPIRED,
        invitedBy: users[6].id,
        expiresAt: yesterday,
      },
    }),
  ]);

  console.log(`✅ Created ${invitations.length} invitations`);

  console.log('\n📊 Seed Data Summary:');
  console.log(`  Companies: ${companies.length}`);
  console.log(`  Users: ${users.length}`);
  console.log(`  UserCompanies: ${userCompanies.length}`);
  console.log(`  Partnerships: ${partnerships.length}`);
  console.log(`  Projects: ${projects.length}`);
  console.log(`  Invitations: ${invitations.length}`);
  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
