-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "lapseUrl" TEXT;

-- CreateTable
CREATE TABLE "JournalMedia" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "entryId" TEXT,
    "kind" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "path" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "JournalMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalMedia_projectId_kind_idx" ON "JournalMedia"("projectId", "kind");

-- CreateIndex
CREATE INDEX "JournalMedia_entryId_idx" ON "JournalMedia"("entryId");

-- AddForeignKey
ALTER TABLE "JournalMedia" ADD CONSTRAINT "JournalMedia_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalMedia" ADD CONSTRAINT "JournalMedia_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

