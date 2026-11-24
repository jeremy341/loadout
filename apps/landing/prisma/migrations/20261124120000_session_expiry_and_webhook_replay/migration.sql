-- Session cleanup deletes by expiry; without this index every sweep scans the whole table (M4).
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- Signed webhook deliveries already processed. A repeat signature is a replay (L3).
CREATE TABLE "WebhookReplay" (
    "signature" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookReplay_pkey" PRIMARY KEY ("signature")
);

CREATE INDEX "WebhookReplay_seenAt_idx" ON "WebhookReplay"("seenAt");
