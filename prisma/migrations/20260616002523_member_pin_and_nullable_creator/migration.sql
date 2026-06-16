-- AlterTable
ALTER TABLE "Member" ADD COLUMN "pinHash" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Market" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "creatorId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'BINARY',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "closesAt" DATETIME NOT NULL,
    "resolvedOutcomeId" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Market_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Market_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Member" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Market" ("closesAt", "createdAt", "creatorId", "description", "id", "orgId", "resolvedAt", "resolvedOutcomeId", "status", "title", "type") SELECT "closesAt", "createdAt", "creatorId", "description", "id", "orgId", "resolvedAt", "resolvedOutcomeId", "status", "title", "type" FROM "Market";
DROP TABLE "Market";
ALTER TABLE "new_Market" RENAME TO "Market";
CREATE INDEX "Market_orgId_status_idx" ON "Market"("orgId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
