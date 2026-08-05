-- CreateTable
CREATE TABLE "AgendaItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timeLabel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "speaker" TEXT,
    "isBreak" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AgendaItem_sortOrder_idx" ON "AgendaItem"("sortOrder");
