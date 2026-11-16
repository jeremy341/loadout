-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "handle" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "demoUrl" TEXT,
ADD COLUMN     "hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "repoUrl" TEXT,
ADD COLUMN     "showBuilding" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ToolbeltUse" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ToolbeltUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolbeltBlock" (
    "id" TEXT NOT NULL,
    "makerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolbeltBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ToolbeltUse_projectId_idx" ON "ToolbeltUse"("projectId");

-- CreateIndex
CREATE INDEX "ToolbeltUse_toolId_idx" ON "ToolbeltUse"("toolId");

-- CreateIndex
CREATE UNIQUE INDEX "ToolbeltUse_projectId_toolId_key" ON "ToolbeltUse"("projectId", "toolId");

-- CreateIndex
CREATE INDEX "ToolbeltBlock_blockedId_idx" ON "ToolbeltBlock"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "ToolbeltBlock_makerId_blockedId_key" ON "ToolbeltBlock"("makerId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_handle_key" ON "Person"("handle");

-- AddForeignKey
ALTER TABLE "ToolbeltUse" ADD CONSTRAINT "ToolbeltUse_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolbeltUse" ADD CONSTRAINT "ToolbeltUse_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolbeltBlock" ADD CONSTRAINT "ToolbeltBlock_makerId_fkey" FOREIGN KEY ("makerId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolbeltBlock" ADD CONSTRAINT "ToolbeltBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Status values for Toolbelt uses (Prisma does not model CHECK constraints).
ALTER TABLE "ToolbeltUse" ADD CONSTRAINT "ToolbeltUse_status_check" CHECK ("status" IN ('pending', 'confirmed', 'declined'));
