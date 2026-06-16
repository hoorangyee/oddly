-- CreateTable
CREATE TABLE "CustomEmoji" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "shortcode" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "blobPathname" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomEmoji_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomEmoji_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketId" TEXT,
    "commentId" TEXT,
    "memberId" TEXT NOT NULL,
    "emoji" TEXT,
    "customEmojiId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reaction_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reaction_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reaction_customEmojiId_fkey" FOREIGN KEY ("customEmojiId") REFERENCES "CustomEmoji" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reaction" ("createdAt", "emoji", "id", "marketId", "memberId") SELECT "createdAt", "emoji", "id", "marketId", "memberId" FROM "Reaction";
DROP TABLE "Reaction";
ALTER TABLE "new_Reaction" RENAME TO "Reaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CustomEmoji_orgId_shortcode_key" ON "CustomEmoji"("orgId", "shortcode");

-- CreateIndex
CREATE INDEX "CustomEmoji_orgId_idx" ON "CustomEmoji"("orgId");

-- CreateIndex
CREATE INDEX "CustomEmoji_creatorId_idx" ON "CustomEmoji"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_marketId_memberId_emoji_key" ON "Reaction"("marketId", "memberId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_marketId_memberId_customEmojiId_key" ON "Reaction"("marketId", "memberId", "customEmojiId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_commentId_memberId_emoji_key" ON "Reaction"("commentId", "memberId", "emoji");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_commentId_memberId_customEmojiId_key" ON "Reaction"("commentId", "memberId", "customEmojiId");

-- CreateIndex
CREATE INDEX "Reaction_marketId_idx" ON "Reaction"("marketId");

-- CreateIndex
CREATE INDEX "Reaction_commentId_idx" ON "Reaction"("commentId");

-- CreateIndex
CREATE INDEX "Reaction_customEmojiId_idx" ON "Reaction"("customEmojiId");
