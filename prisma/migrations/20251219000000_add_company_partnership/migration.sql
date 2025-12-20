-- CreateTable
CREATE TABLE "company_partnerships" (
    "id" TEXT NOT NULL,
    "companyId1" TEXT NOT NULL,
    "companyId2" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_partnerships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_partnerships_companyId1_companyId2_key" ON "company_partnerships"("companyId1", "companyId2");

-- AddForeignKey
ALTER TABLE "company_partnerships" ADD CONSTRAINT "company_partnerships_companyId1_fkey" FOREIGN KEY ("companyId1") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_partnerships" ADD CONSTRAINT "company_partnerships_companyId2_fkey" FOREIGN KEY ("companyId2") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;


