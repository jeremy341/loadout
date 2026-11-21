-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "keptMinutes" INTEGER,
ADD COLUMN     "reviewAction" TEXT,
ADD COLUMN     "reviewReason" TEXT,
ADD COLUMN     "seq" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "approvedMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "assignmentRemindedAt" TIMESTAMP(3),
ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "claimHeartbeatAt" TIMESTAMP(3),
ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "claimedBy" TEXT,
ADD COLUMN     "firstPassAt" TIMESTAMP(3),
ADD COLUMN     "firstPassBy" TEXT,
ADD COLUMN     "firstPassMinutes" INTEGER,
ADD COLUMN     "firstPassNote" TEXT,
ADD COLUMN     "firstShippedAt" TIMESTAMP(3),
ADD COLUMN     "heldBy" TEXT,
ADD COLUMN     "holdReason" TEXT,
ADD COLUMN     "proposedBanBy" TEXT,
ADD COLUMN     "proposedBanReason" TEXT,
ADD COLUMN     "reshippedAt" TIMESTAMP(3),
ADD COLUMN     "reviewReason" TEXT,
ADD COLUMN     "seq" SERIAL NOT NULL,
ADD COLUMN     "triage" TEXT,
ADD COLUMN     "triageAt" TIMESTAMP(3),
ADD COLUMN     "triageBy" TEXT,
ADD COLUMN     "triageNote" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_seq_key" ON "JournalEntry"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "Project_seq_key" ON "Project"("seq");


-- The reviewer desk uses these as its ship and journal numbers. Start them at 100000 so they never meet the sample ships.
UPDATE "Project" SET "seq" = "seq" + 100000;
UPDATE "JournalEntry" SET "seq" = "seq" + 100000;
SELECT setval(pg_get_serial_sequence('"Project"', 'seq'), GREATEST(100000, COALESCE((SELECT MAX("seq") FROM "Project"), 100000)));
SELECT setval(pg_get_serial_sequence('"JournalEntry"', 'seq'), GREATEST(100000, COALESCE((SELECT MAX("seq") FROM "JournalEntry"), 100000)));
