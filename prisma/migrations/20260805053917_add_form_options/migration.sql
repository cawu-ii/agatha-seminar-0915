-- CreateTable
CREATE TABLE "FormOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "FormOption_field_sortOrder_idx" ON "FormOption"("field", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FormOption_field_value_key" ON "FormOption"("field", "value");
