-- CreateTable
CREATE TABLE "sheet_markers" (
    "id" TEXT NOT NULL,
    "sheetId" TEXT NOT NULL,
    "sheetVersionId" TEXT,
    "type" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sheet_markers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sheet_markers" ADD CONSTRAINT "sheet_markers_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheet_markers" ADD CONSTRAINT "sheet_markers_sheetVersionId_fkey" FOREIGN KEY ("sheetVersionId") REFERENCES "sheet_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

