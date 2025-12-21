CREATE TABLE "sheet_marker_comments" (
    "id" TEXT NOT NULL,
    "markerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sheet_marker_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sheet_marker_comments" ADD CONSTRAINT "sheet_marker_comments_markerId_fkey" FOREIGN KEY ("markerId") REFERENCES "sheet_markers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheet_marker_comments" ADD CONSTRAINT "sheet_marker_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sheet_marker_comments" ADD CONSTRAINT "sheet_marker_comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "sheet_marker_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
