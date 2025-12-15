-- CreateEnum
CREATE TYPE "ProjectVisibility" AS ENUM ('PRIVATE', 'COMPANY_INTERNAL', 'PUBLIC');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_companies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userType" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_companies" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_companies_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "projects" ADD COLUMN "visibility" "ProjectVisibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateIndex
CREATE UNIQUE INDEX "user_companies_userId_companyId_key" ON "user_companies"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "project_companies_projectId_companyId_key" ON "project_companies"("projectId", "companyId");

-- AddForeignKey
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_companies" ADD CONSTRAINT "user_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_companies" ADD CONSTRAINT "project_companies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_companies" ADD CONSTRAINT "project_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 既存データの移行: デフォルト会社を作成
INSERT INTO "companies" ("id", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'デフォルト会社', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "companies" LIMIT 1);

-- 既存データの移行: 既存ユーザーのuserTypeをUserCompanyに移行
INSERT INTO "user_companies" ("id", "userId", "companyId", "userType", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    u."id",
    (SELECT "id" FROM "companies" LIMIT 1),
    COALESCE(u."userType", 4),
    u."createdAt",
    u."updatedAt"
FROM "users" u
WHERE NOT EXISTS (
    SELECT 1 FROM "user_companies" uc WHERE uc."userId" = u."id"
);

-- 既存データの移行: 既存プロジェクトのvisibilityをPRIVATEに設定（既にデフォルトで設定されているが、明示的に設定）
UPDATE "projects" SET "visibility" = 'PRIVATE' WHERE "visibility" IS NULL;

-- DropColumn (既存データの移行が完了した後)
ALTER TABLE "users" DROP COLUMN "userType";

