-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Indicator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT,
    "sourceUrl" TEXT,
    "warnAbove" REAL,
    "badAbove" REAL,
    "warnBelow" REAL,
    "badBelow" REAL,
    "fetchCron" TEXT,
    "alertEnabled" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Indicator" ("badAbove", "badBelow", "category", "fetchCron", "id", "key", "label", "sourceUrl", "unit", "warnAbove", "warnBelow") SELECT "badAbove", "badBelow", "category", "fetchCron", "id", "key", "label", "sourceUrl", "unit", "warnAbove", "warnBelow" FROM "Indicator";
DROP TABLE "Indicator";
ALTER TABLE "new_Indicator" RENAME TO "Indicator";
CREATE UNIQUE INDEX "Indicator_key_key" ON "Indicator"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
