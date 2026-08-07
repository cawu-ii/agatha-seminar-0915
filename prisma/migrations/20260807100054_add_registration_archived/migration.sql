-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Registration" (
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
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Registration" ("agreeMarketing", "agreeTerms", "company", "consult", "consultOther", "createdAt", "dept", "deptOther", "email", "emailSentAt", "emailStatus", "eventId", "id", "idempotencyKey", "industry", "industryOther", "metaCapiSentAt", "metaCapiStatus", "name", "phone", "ragicSyncedAt", "reviewed", "reviewerNote", "sessions", "size", "stage", "stageOther", "taxId", "title", "titleOther", "utmCampaign", "utmContent", "utmMedium", "utmSource") SELECT "agreeMarketing", "agreeTerms", "company", "consult", "consultOther", "createdAt", "dept", "deptOther", "email", "emailSentAt", "emailStatus", "eventId", "id", "idempotencyKey", "industry", "industryOther", "metaCapiSentAt", "metaCapiStatus", "name", "phone", "ragicSyncedAt", "reviewed", "reviewerNote", "sessions", "size", "stage", "stageOther", "taxId", "title", "titleOther", "utmCampaign", "utmContent", "utmMedium", "utmSource" FROM "Registration";
DROP TABLE "Registration";
ALTER TABLE "new_Registration" RENAME TO "Registration";
CREATE UNIQUE INDEX "Registration_eventId_key" ON "Registration"("eventId");
CREATE UNIQUE INDEX "Registration_idempotencyKey_key" ON "Registration"("idempotencyKey");
CREATE INDEX "Registration_utmSource_utmContent_idx" ON "Registration"("utmSource", "utmContent");
CREATE INDEX "Registration_createdAt_idx" ON "Registration"("createdAt");
CREATE INDEX "Registration_reviewed_idx" ON "Registration"("reviewed");
CREATE INDEX "Registration_archived_idx" ON "Registration"("archived");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
