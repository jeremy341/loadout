-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "slackId" TEXT;

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageTs" TEXT NOT NULL,
    "authorSlackId" TEXT NOT NULL,
    "authorPersonId" TEXT,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "claimedBy" TEXT,
    "closedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "keepOpen" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "slackTs" TEXT,
    "authorKind" TEXT NOT NULL,
    "authorSlackId" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotQaCache" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "links" TEXT[],
    "hits" INTEGER NOT NULL DEFAULT 0,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotQaCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotJob" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ownerSlackId" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotOutbox" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "slackId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "href" TEXT,
    "dedupeKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotHelper" (
    "slackId" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BotHelper_pkey" PRIMARY KEY ("slackId")
);

-- CreateIndex
CREATE INDEX "Ticket_status_lastMessageAt_idx" ON "Ticket"("status", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_channelId_messageTs_key" ON "Ticket"("channelId", "messageTs");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "BotQaCache_question_key" ON "BotQaCache"("question");

-- CreateIndex
CREATE INDEX "BotJob_doneAt_runAt_idx" ON "BotJob"("doneAt", "runAt");

-- CreateIndex
CREATE INDEX "BotJob_ownerSlackId_idx" ON "BotJob"("ownerSlackId");

-- CreateIndex
CREATE UNIQUE INDEX "BotOutbox_dedupeKey_key" ON "BotOutbox"("dedupeKey");

-- CreateIndex
CREATE INDEX "BotOutbox_status_nextAttemptAt_idx" ON "BotOutbox"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "Person_slackId_key" ON "Person"("slackId");

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

