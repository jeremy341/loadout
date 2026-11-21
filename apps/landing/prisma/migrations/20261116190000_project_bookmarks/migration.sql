-- CreateTable
CREATE TABLE "ProjectBookmark" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectBookmark_personId_idx" ON "ProjectBookmark"("personId");

-- CreateIndex
CREATE INDEX "ProjectBookmark_projectId_idx" ON "ProjectBookmark"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectBookmark_personId_projectId_key" ON "ProjectBookmark"("personId", "projectId");

-- AddForeignKey
ALTER TABLE "ProjectBookmark" ADD CONSTRAINT "ProjectBookmark_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBookmark" ADD CONSTRAINT "ProjectBookmark_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
