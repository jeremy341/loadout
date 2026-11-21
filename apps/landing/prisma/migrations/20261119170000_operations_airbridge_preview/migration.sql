CREATE TABLE "ProgramOperation" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "pausedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramOperation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProgramOperation_date_range" CHECK ("endsAt" > "startsAt")
);

CREATE UNIQUE INDEX "ProgramOperation_slug_key" ON "ProgramOperation"("slug");

CREATE TABLE "AirbridgePreviewCheck" (
    "projectNumber" INTEGER NOT NULL,
    "unifiedId" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "repository" TEXT,
    "state" TEXT NOT NULL,
    "hours" DOUBLE PRECISION,
    "attemptedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "AirbridgePreviewCheck_pkey" PRIMARY KEY ("projectNumber")
);
