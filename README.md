This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Demo akkauntlar

Barcha akkauntlar uchun parol: **`demo123`**

| Login         | Rol                       |
| ------------- | ------------------------- |
| `admin`       | Administrator             |
| `teacher`     | O'qituvchi                |
| `student`     | O'quvchi                  |
| `bookmanager` | Kitob menejeri            |
| `registrar`   | Ro'yxatga oluvchi         |

Akkauntlar `scripts/add-demo-users.ts` orqali yaratiladi:
```bash
npx tsx scripts/add-demo-users.ts
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Firebase App Hosting'ga deploy

Repo App Hosting uchun tayyor: `apphosting.yaml` (env/secret), `build`
skripti `prisma generate && next build`, `engines.node = 22`
(konsolda **Node.js 22** ni tanlang).

### 1. Baza (Postgres) tayyorlash

App Hosting **Firestore** bilan ishlamaydi — loyiha Prisma + PostgreSQL
ustida qurilgan. Supabase / Neon / Cloud SQL'dan connection string oling.

### 2. Sekretlarni yaratish (bir marta)

```bash
firebase login
firebase use <firebase-project-id>

firebase apphosting:secrets:set DATABASE_URL   # postgresql://...?sslmode=require
firebase apphosting:secrets:set APP_SECRET     # openssl rand -base64 48
```

### 3. Backend yaratish

Firebase Console → **Build → App Hosting → Create backend**:

- GitHub repo: `anvarovmuhammadamin011-ops/mbsi-libraryV2`
- Live branch: `main` (yoki `master`)
- Root directory: `/`
- Environment: `apphosting.yaml` avtomatik o'qiladi

Birinchi deploy bir necha daqiqa davom etadi; keyin har bir `git push`
avtomatik yangilanadi.

### 4. Deploydan keyin

```bash
# jadvallarni yaratish (bir marta, lokal terminaldan)
DATABASE_URL="postgresql://..." npx prisma migrate deploy
# demo akkauntlar (ixtiyoriy)
DATABASE_URL="postgresql://..." node prisma/accounts-seed.mjs
```

### Muhim eslatmalar

- **Fayl saqlash:** Cloud Run diski vaqtinchalik. `STORAGE_DRIVER=db`
  (default) yoki `s3` bo'lishi kerak — `local` ishlatilmaydi.
- **Muqovalar S3/CDN'dan berilsa:** `next.config.ts` dagi CSP
  `img-src` ga o'sha domenni qo'shish shart, aks holda rasmlar bloklanadi.
- **Push (FCM):** `apphosting.yaml` dagi `NEXT_PUBLIC_FIREBASE_*` va
  `FIREBASE_SERVICE_ACCOUNT_JSON` bloklarini to'ldiring. Bo'sh bo'lsa
  push o'chadi, qolgan funksiyalar ishlaydi.
