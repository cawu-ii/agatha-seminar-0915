-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "deptOther" TEXT,
    "title" TEXT NOT NULL,
    "titleOther" TEXT,
    "industry" TEXT NOT NULL,
    "industryOther" TEXT,
    "size" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "sessions" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "stageOther" TEXT,
    "consult" TEXT NOT NULL,
    "consultOther" TEXT,
    "agreeTerms" BOOLEAN NOT NULL,
    "agreeMarketing" BOOLEAN NOT NULL DEFAULT false,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "emailStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "emailSentAt" DATETIME,
    "metaCapiStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "metaCapiSentAt" DATETIME,
    "ragicSyncedAt" DATETIME,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewerNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_key" ON "Registration"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_idempotencyKey_key" ON "Registration"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Registration_utmSource_utmContent_idx" ON "Registration"("utmSource", "utmContent");

-- CreateIndex
CREATE INDEX "Registration_createdAt_idx" ON "Registration"("createdAt");

-- CreateIndex
CREATE INDEX "Registration_reviewed_idx" ON "Registration"("reviewed");
