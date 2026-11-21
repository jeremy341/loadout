-- Ship status: when a project was submitted, how often it was resubmitted, the reviewer's note, the hold flag, the last status
-- change, whether an approved project is open for an update ship, and the builder's change note.
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "changeNote" TEXT,
ADD COLUMN     "heldAt" TIMESTAMP(3),
ADD COLUMN     "isUpdate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resubmitCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "statusChangedAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- Old spellings become the names in lib/platform/ship.ts: hyphens, and "second-pass" for the desk's old spot check.
UPDATE "Project" SET "status" = 'in-review' WHERE "status" = 'in_review';
UPDATE "Project" SET "status" = 'needs-changes' WHERE "status" = 'needs_changes';
UPDATE "Project" SET "status" = 'second-pass' WHERE "status" IN ('second_review', 'spot-check', 'spot_check');
