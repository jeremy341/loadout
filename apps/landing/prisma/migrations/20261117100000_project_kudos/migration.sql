-- CreateTable
CREATE TABLE "ProjectKudos" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectKudos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectKudos_projectId_idx" ON "ProjectKudos"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectKudos_personId_projectId_key" ON "ProjectKudos"("personId", "projectId");

-- AddForeignKey
ALTER TABLE "ProjectKudos" ADD CONSTRAINT "ProjectKudos_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectKudos" ADD CONSTRAINT "ProjectKudos_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

