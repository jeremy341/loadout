-- CreateTable
CREATE TABLE "ProjectExpedition" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "expeditionId" TEXT NOT NULL,
    "equippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unequippedAt" TIMESTAMP(3),

    CONSTRAINT "ProjectExpedition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectExpedition_projectId_idx" ON "ProjectExpedition"("projectId");

-- CreateIndex
CREATE INDEX "ProjectExpedition_expeditionId_idx" ON "ProjectExpedition"("expeditionId");

-- AddForeignKey
ALTER TABLE "ProjectExpedition" ADD CONSTRAINT "ProjectExpedition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
