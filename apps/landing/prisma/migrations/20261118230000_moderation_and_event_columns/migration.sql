-- AlterTable
ALTER TABLE "Ban" ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "BanProposal" ADD COLUMN     "days" INTEGER;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "anonymous" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AgeException" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'show_and_tell',
ADD COLUMN     "stoppedAt" TIMESTAMP(3);

