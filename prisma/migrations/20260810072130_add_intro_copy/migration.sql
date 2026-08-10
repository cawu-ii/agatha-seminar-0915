-- CreateTable
CREATE TABLE "IntroCopy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "IntroCopy_field_key" ON "IntroCopy"("field");
