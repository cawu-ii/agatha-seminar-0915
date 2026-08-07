-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'COORGANIZER',
    "sortOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Partner" ("category", "createdAt", "description", "id", "logoUrl", "name", "sortOrder", "updatedAt") SELECT "category", "createdAt", "description", "id", "logoUrl", "name", "sortOrder", "updatedAt" FROM "Partner";
DROP TABLE "Partner";
ALTER TABLE "new_Partner" RENAME TO "Partner";
CREATE INDEX "Partner_sortOrder_idx" ON "Partner"("sortOrder");
CREATE INDEX "Partner_category_idx" ON "Partner"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
