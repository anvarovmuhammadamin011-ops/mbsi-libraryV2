-- Push bildirishnomalari uchun jadvallar (FCM Web Push).
--
-- Bu fayl HUJJAT uchun: jadvallar live Neon DB'da allaqachon mavjud va
-- quyidagi DDL bo'yicha yaratilgan (2026-10).
--
-- Nima uchun alohida fayl, migration emas:
--   * `prisma/migrations/0_init/migration.sql` da `users.telegram_id` bor,
--     lekin joriy `prisma/schema.prisma` da yo'q -> `prisma migrate diff`
--     shu ustunni DROP qilishni taklif qiladi.
--   * Live DB'da `_prisma_migrations` jadvali yo'q (db push bilan yaratilgan),
--     shuning uchun `migrate deploy` ishlaydi va `migrate dev` shadow DB'da
--     `P3006/P1001` bilan qulaydi.
--   * `prisma db push` bu holatda `users.telegram_id` ma'lumotini va
--     `_wtest` jadvalini YO'QOTADI.
-- Shuning uchun faqat qo'shimcha (additive) DDL qo'llanadi.

-- Foydalanuvchining qurilma/token obunalari
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
    "id"         TEXT NOT NULL,
    "user_id"    TEXT NOT NULL,
    "endpoint"   TEXT NOT NULL,
    -- FCM getToken() faqat registration token beradi, shuning uchun ixtiyoriy
    "p256dh"     TEXT,
    "auth"       TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX IF NOT EXISTS "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_user_id_fkey') THEN
    ALTER TABLE "push_subscriptions"
      ADD CONSTRAINT "push_subscriptions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Foydalanuvchi ichidagi bildirishnomalar (DB da saqlanadi, FCM orqali yuboriladi)
CREATE TABLE IF NOT EXISTS "notifications" (
    "id"         TEXT NOT NULL,
    "user_id"    TEXT NOT NULL,
    "type"       TEXT NOT NULL DEFAULT 'system',
    "title"      TEXT NOT NULL,
    "body"       TEXT NOT NULL,
    "url"        TEXT,
    "icon"       TEXT,
    "read_at"    TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;