-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "desktopUrl" TEXT,
    "mobileUrl" TEXT,
    "altText" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EventInfo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field" TEXT NOT NULL,
    "line1" TEXT NOT NULL,
    "line2" TEXT,
    "subText" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "EventInfo_field_key" ON "EventInfo"("field");
