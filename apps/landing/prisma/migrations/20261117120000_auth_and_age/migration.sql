-- Hack Club Auth identity and age on Person, and the one-time sign-in attempts table.
-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "birthday" DATE,
ADD COLUMN     "hcaId" TEXT,
ADD COLUMN     "hcaSyncedAt" TIMESTAMP(3),
ADD COLUMN     "verificationStatus" TEXT;

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "nonceHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttempt_state_key" ON "LoginAttempt"("state");

-- CreateIndex
CREATE INDEX "LoginAttempt_expiresAt_idx" ON "LoginAttempt"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Person_hcaId_key" ON "Person"("hcaId");
