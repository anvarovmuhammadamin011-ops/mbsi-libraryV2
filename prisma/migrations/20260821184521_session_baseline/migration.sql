-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_reading_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "start_page" INTEGER NOT NULL,
    "baseline_page" INTEGER NOT NULL DEFAULT 0,
    "end_page" INTEGER NOT NULL DEFAULT 0,
    "pages_read" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" DATETIME,
    CONSTRAINT "reading_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reading_sessions_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_reading_sessions" ("book_id", "duration", "end_page", "ended_at", "id", "pages_read", "start_page", "started_at", "user_id") SELECT "book_id", "duration", "end_page", "ended_at", "id", "pages_read", "start_page", "started_at", "user_id" FROM "reading_sessions";
DROP TABLE "reading_sessions";
ALTER TABLE "new_reading_sessions" RENAME TO "reading_sessions";
CREATE INDEX "reading_sessions_user_id_idx" ON "reading_sessions"("user_id");
CREATE INDEX "reading_sessions_book_id_idx" ON "reading_sessions"("book_id");
CREATE INDEX "reading_sessions_started_at_idx" ON "reading_sessions"("started_at");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
