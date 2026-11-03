# 📚 MBSI Library

> **Maktab kutubxonasi — endi kompyuter va telefonda.**
> O'quvchi kitob o'qiydi, tizim qaysi betda qolganini eslab qoladi, maktab esa natijalarni ko'radi.

Bu hujjat **ikki qismdan** iborat:

| Qism | Kim uchun? | Nimalar bor? |
| --- | --- | --- |
| **1-qism — Hammaga tushunarli** | Direktor, o'qituvchi, kutubxonachi, ota-ona, taqdimot tinglovchilari | Tizim nima, nima uchun kerak, qanday ishlaydi, qanday sinab ko'rish mumkin |
| **2-qism — Texnik ma'lumot** | Dasturchi, tizim administratori | O'rnatish, kod tuzilishi, API, ma'lumotlar bazasi, xavfsizlik, deployment |

> Agar siz dasturchi bo'lmasangiz — **1-qismni** o'qing. Bu sizga tizimni tushunish va taqdimot qilish uchun yetarli.
> Agar loyihani o'rnatmoqchi bo'lsangiz — **2-qismdagi "O'rnatish"** bo'limiga o'ting.

---

## Mundarija

**1-qism — Hammaga tushunarli**

1. [Bu tizim nima?](#1-bu-tizim-nima)
2. [Qanday muammoni hal qiladi?](#2-qanday-muammoni-hal-qiladi)
3. [Kim foydalanadi?](#3-kim-foydalanadi)
4. [Tizimda nimalar bor?](#4-tizimda-nimalar-bor)
5. [Demo akkauntlar — qanday kirish mumkin?](#5-demo-akkauntlar--qanday-kirish-mumkin)
6. [Tizimni sinab ko'rish](#6-tizimni-sinab-korish)
7. [Sayt bo'ylab qisqa sayohat](#7-sayt-boylab-qisqa-sayohat)
8. [Ball, missiya va reyting qanday ishlaydi?](#8-ball-missiya-va-reyting-qanday-ishlaydi)
9. [Login va xavfsizlik — oddiy tilda](#9-login-va-xavfsizlik--oddiy-tilda)
10. [Ko'p so'raladigan savollar](#10-kop-soraladigan-savollar)
11. [Lug'at — qiyin so'zlar izohi](#11-lugat--qiyin-sozlar-izohi)

**2-qism — Texnik ma'lumot**

12. [Texnologiyalar](#12-texnologiyalar)
13. [O'rnatilgan kutubxonalar](#13-ornatilgan-kutubxonalar)
14. [Arxitektura](#14-arxitektura)
15. [Papka tuzilishi](#15-papka-tuzilishi)
16. [Login va rollar — texnik tafsilot](#16-login-va-rollar--texnik-tafsilot)
17. [Frontend](#17-frontend)
18. [Backend va API](#18-backend-va-api)
19. [Ma'lumotlar bazasi](#19-malumotlar-bazasi)
20. [Xavfsizlik](#20-xavfsizlik)
21. [O'rnatish](#21-ornatish)
22. [.env, .env.example va .gitignore](#22-env-envexample-va-gitignore)
23. [Environment variables](#23-environment-variables)
24. [Scripts — buyruqlar](#24-scripts--buyruqlar)
25. [Testlar va sifat tekshiruvi](#25-testlar-va-sifat-tekshiruvi)
26. [Deployment — internetga chiqarish](#26-deployment--internetga-chiqarish)
27. [Performance va scaling](#27-performance-va-scaling)
28. [Muammolarni bartaraf etish](#28-muammolarni-bartaraf-etish)
29. [Taqdimot uchun materiallar](#29-taqdimot-uchun-materiallar)
30. [Yo'l xaritasi](#30-yol-xaritasi)
31. [Litsenziya va aloqa](#31-litsenziya-va-aloqa)

---

# 🧑‍🏫 1-QISM: HAMMAGA TUSHUNARLI

## 1. Bu tizim nima?

Tasavvur qiling, maktab kutubxonasi bor. Unda minglab kitoblar, o'quvchilar, o'qituvchilar va kutubxonachi ishlaydi. Har bir o'quvchi qaysi kitobni o'qiyotganini, qaysi betda qolganini va qancha o'qiganini bilish kerak. Hisobotlar esa qo'lda yuritiladi — bu vaqt oladi va xato bo'ladi.

**MBSI Library** — shu kutubxonaning **onlayn versiyasi**. O'quvchi telefon yoki kompyuterda kitob ochadi, o'qiydi, tizim esa hammasini o'zi yozib boradi.

Oddiy qilib aytganda:

| Kutubxonadagi narsa | MBSI Library'da |
| --- | --- |
| Kitob javonlari | Onlayn katalog (qidiruv, kategoriyalar) |
| Kitob varaqlash | PDF yoki matn rejimidagi o'quvchi (reader) |
| O'quvchi daftari | Shaxsiy profil va o'qish tarixi |
| O'qish kundaligi | Statistika: betlar, vaqt, streak |
| Kutubxonachi | Kitob menejeri paneli |
| Musobaqa va rag'bat | Ballar, missiyalar, reyting, achievementlar |
| Qo'riqchi | Login, rollar va xavfsizlik tizimi |

Tizim **brauzerda** ishlaydi — alohida dastur o'rnatish shart emas. Telefonga esa **PWA** sifatida (saytni ilova kabi) o'rnatish mumkin.

---

## 2. Qanday muammoni hal qiladi?

| Avvalgi holat | MBSI Library bilan |
| --- | --- |
| Kitoblar turli papkalarda, qaysi biri bor-yo'qligi noma'lum | Hammasi bitta katalogda: muallif, kategoriya, til, muqova, PDF |
| O'quvchi qaysi betda qolganini eslay olmaydi | Tizim har bir kitob uchun oxirgi o'qilgan betni saqlaydi |
| Kim qancha o'qiganini bilish qiyin | Har bir o'qish sessiyasi va betlar soni yoziladi |
| O'quvchilarni o'qishga rag'batlantirish qiyin | Ballar, missiyalar, reyting, achievementlar va "battle" |
| Hisobotlar qo'lda yuritiladi | Admin va menejer panelida real vaqt statistikasi |
| Turli xodimlarga turli ruxsat kerak | 6 ta rol va har biriga alohida panel |

**Asosiy g'oya:** kitob o'qish — foydali, lekin zerikarli bo'lishi mumkin. Tizim o'qishni **o'yin elementlari** bilan qiziqarli qiladi, maktab esa aniq raqamlarni ko'radi.

---

## 3. Kim foydalanadi?

Tizimda **6 xil rol** bor. Har bir rol faqat o'ziga kerakli qismni ko'radi.

| Rol | Kim bu? | Tizimda nima qiladi? |
| --- | --- | --- |
| 👨‍🎓 **O'quvchi** (STUDENT) | Maktab o'quvchisi | Kitob o'qiydi, progress saqlaydi, ball va reytingda qatnashadi |
| 👨‍🏫 **O'qituvchi** (TEACHER) | Dars beruvchi | O'quvchi kabi o'qiydi + "o'quvchilar vs xodimlar" battle'ida qatnashadi |
| 🛠 **Administrator** (ADMIN) | Maktab rahbariyati / IT | Hamma narsani boshqaradi: foydalanuvchilar, kitoblar, sozlamalar |
| 📚 **Kitob menejeri** (BOOK_MANAGER) | Kutubxonachi | Kitob qo'shadi, tahrirlaydi, kategoriyalarni boshqaradi |
| 📝 **Ro'yxatga oluvchi** (REGISTRAR) | Qabul bo'limi xodimi | Yangi o'quvchi akkauntini yaratadi, arizalarni tasdiqlaydi |
| ⚙️ **Xodim** (STAFF) | Boshqa xodim | O'qish imkoniyatlari + battle |

> **Muhim:** har bir rol faqat o'z paneliga kira oladi. Masalan, o'quvchi admin panelini ocholmaydi — tizim avtomatik bosh sahifasiga qaytaradi.

---

## 4. Tizimda nimalar bor?

### 👨‍🎓 O'quvchi uchun

- 📖 **Kitob o'qish** — PDF sahifama-sahifa: zoom, ekranga moslash, to'liq ekran, tungi rejim.
- 📝 **Matn rejimi** — agar PDF ichidagi matn ajratilgan bo'lsa, uni oddiy matn kabi o'qish mumkin.
- 💾 **Avtomatik saqlash** — qaysi betda to'xtagan bo'lsangiz, keyingi safar o'sha yerdan davom etadi.
- ⭐ **Sevimlilar va xatcho'plar** — yoqqan kitoblarni saqlash, muhim betni belgilash.
- 🌟 **Baholash va sharh** — kitobga 1–5 yulduz qo'yish va fikr yozish.
- 🎯 **O'qish maqsadlari** — "oyiga nechta kitob" yoki "kuniga necha daqiqa".
- 🏆 **Ballar va missiyalar** — vazifalarni bajarib ball yig'ish.
- 📊 **Statistika** — o'qilgan betlar, sarflangan vaqt, ketma-ket o'qilgan kunlar (streak).
- 🥇 **Reyting** — boshqa o'quvchilar bilan solishtirish.
- 🔔 **Bildirishnomalar** — yangi missiya, kitob yoki reyting yangiliklari.
- 🌙 **Mavzu va til** — kunduzgi/tungi rejim, o'zbek va rus tillari.
- 📱 **Telefonga o'rnatish** — PWA orqali ilova kabi ishlatish.

### 📚 Kitob menejeri uchun

- Kitob qo'shish, tahrirlash, o'chirish.
- PDF va muqova yuklash.
- Kategoriyalar va mualliflar bilan ishlash.
- Kitobni "faol", "yashirilgan" yoki "qoralama" holatiga o'tkazish.
- Ommaviy import — ko'p kitobni bir vaqtda qo'shish.
- Qaysi kitob ko'p o'qilayotganini ko'rish.
- AI yordamida kategoriya tavsiyasi (ixtiyoriy).

### 🛠 Administrator uchun

- Umumiy KPI: foydalanuvchilar, kitoblar, o'qish faolligi.
- Foydalanuvchi yaratish, rolini o'zgartirish, bloklash.
- Parolni tiklash va login ma'lumotlarini ko'rsatish.
- O'quvchi arizalarini tasdiqlash yoki rad etish.
- Kitoblarni boshqarish va PDF matnini ajratish (extract).
- Tizim sozlamalari: faollik mezonlari, battle ballari, maksimal faol kitoblar.
- "O'quvchilar vs Xodimlar" battle dashboardi.
- Audit log — kim, qachon, nima qilgani.

### 📝 Ro'yxatga oluvchi uchun

- Yangi o'quvchi akkauntini yaratish.
- Login va parolni bir marta ko'rsatish (keyin ko'rsatilmaydi).
- Tasdiqlanmagan arizalar ro'yxatini ko'rish.
- O'quvchilar ro'yxati va holatini tekshirish.

---

## 5. Demo akkauntlar — qanday kirish mumkin?

Tizimni sinash uchun tayyor akkauntlar bor. **Barchasining paroli: `demo123`**

| Login | Rol | Qaysi panelga kiradi? |
| --- | --- | --- |
| `admin` | Administrator | `/admin` |
| `student` | O'quvchi | `/home` |
| `teacher` | O'qituvchi | `/home` |
| `staff` | Xodim | `/home` |
| `kitobmanager` | Kitob menejeri | `/manager` |
| `oquvchimanager` | Ro'yxatga oluvchi | `/registrar` |

**Qanday kirish:**

1. Saytni oching — login sahifasi chiqadi.
2. Yuqorida 3 ta tezkor tugma bor: **Foydalanuvchi**, **Kitob menejeri**, **Administrator**.
3. Qolgan akkauntlar uchun pastdagi **login va parol formasi**dan foydalaning.

> ⚠️ **Diqqat:** `demo123` faqat sinov uchun. Haqiqiy maktabda ishlatishdan oldin parollarni albatta o'zgartiring. Buni administrator yoki dasturchi `.env` faylidagi `DEMO_PASSWORD_*` qiymatlari orqali qiladi.

---

## 6. Tizimni sinab ko'rish

### A) Agar tayyor sayt havolasi bo'lsa (eng oson)

1. Havolani brauzerga kiriting.
2. Yuqoridagi demo loginlardan birini ishlating.
3. Hech narsa o'rnatish shart emas.

### B) O'z kompyuteringizda ishga tushirish (texnik)

Bu yo'l uchun kompyuterga **Node.js** va **PostgreSQL** o'rnatilgan bo'lishi kerak. Agar bu so'zlar notanish bo'lsa — dasturchi yoki IT xodimidan yordam so'rang. Quyidagi qadamlar **2-qismdagi "O'rnatish"** bo'limida batafsil yozilgan.

Qisqacha:

```bash
# 1. Loyiha papkasiga kirish
cd mbsi-libraryV2

# 2. Kerakli paketlarni o'rnatish
npm install

# 3. .env faylini yaratish va to'ldirish
#    (Windows: Copy-Item .env.example .env)
#    (macOS/Linux: cp .env.example .env)

# 4. Ma'lumotlar bazasini tayyorlash
npm run db:migrate
npm run db:accounts

# 5. Serverni ishga tushirish
npm run dev
```

So'ng brauzerda **http://localhost:3000** manzilini oching.

> 💡 **Maslahat:** birinchi marta ishga tushirishda xatolik chiqsa, `README`ning **"Muammolarni bartaraf etish"** bo'limiga qarang. Eng ko'p uchraydigan sabab — PostgreSQL ishlamayapti yoki `.env` to'liq emas.

---

## 7. Sayt bo'ylab qisqa sayohat

### O'quvchi paneli

| Sahifa | Manzil | Nima bor? |
| --- | --- | --- |
| Bosh sahifa | `/home` | Tavsiyalar, davom ettirish, mashhur kitoblar |
| Kutubxona | `/library` | Barcha kitoblar |
| Kitoblar | `/books` | Katalog va filtrlar |
| Kitob sahifasi | `/books/[id]` | Kitob haqida ma'lumot, sharhlar, "o'qish" tugmasi |
| Qidiruv | `/search` | Kitob, muallif, kategoriya bo'yicha qidiruv |
| Kategoriyalar | `/categories` | Mavzular bo'yicha kitoblar |
| Sevimlilar | `/favorites` | Saqlangan kitoblar |
| Xatcho'plar | `/bookmarks` | Belgilangan betlar |
| Davom ettirish | `/continue-reading` | Boshlangan kitoblar |
| Tarix | `/history` | O'qilgan kitoblar tarixi |
| Reyting | `/ranking` | Eng faol o'quvchilar |
| Missiyalar | `/missions` | Vazifalar va mukofotlar |
| Achievementlar | `/achievements` | Erishilgan yutuqlar |
| Statistika | `/statistics` | Shaxsiy raqamlar |
| Reja | `/plan` | O'qish maqsadlari |
| Bildirishnomalar | `/notifications` | Xabarlar |
| Profil | `/profile` | Shaxsiy ma'lumotlar |
| Sozlamalar | `/settings` | Til, mavzu, akkaunt |
| Reader | `/reader/[id]` | To'liq ekranda PDF o'qish |
| Matn reader | `/reader/[id]/text` | Matn rejimida o'qish |

### Boshqa panellar

| Panel | Manzil | Kim uchun? |
| --- | --- | --- |
| Admin | `/admin` | Administrator |
| Kitob menejeri | `/manager` | Kutubxonachi |
| Ro'yxatga oluvchi | `/registrar` | Qabul xodimi |
| Login | `/login` | Hamma |

---

## 8. Ball, missiya va reyting qanday ishlaydi?

Bu qism — tizimning **o'yin qismi**. Maqsad: o'quvchini kitob o'qishga qiziqtirish.

### Ballar

- Har bir foydalanuvchining **0 dan 12 gacha** balli bor.
- Ball olishning asosiy yo'li — **missiyalarni bajarish**.
- Kitob o'qish ham oz miqdorda ball beradi (0.02–0.08), lekin asosiy manba emas.
- Missiya qiyinligiga qarab ball: oson +0.3, o'rtacha +0.6, qiyin +1.0, epik +1.5.
- Bajarilmagan missiya uchun **−0.5** jarima bo'lishi mumkin.
- Administrator qo'lda ball qo'shishi yoki olib tashlashi mumkin.

### Missiyalar

Missiya — bu aniq vazifa, masalan:

- "7 kun ketma-ket o'qi" — streak missiyasi.
- "Shu oyda 300 bet o'qi" — hajm missiyasi.
- "5 ta kitobni tugat" — natija missiyasi.

Har bir missiyaning muddati, maqsadi va mukofoti bor. Bajarilgach, foydalanuvchi **"Mukofotni olish"** tugmasini bosadi.

### Streak

**Streak** — ketma-ket necha kun kitob o'qilgani. Masalan, bugun, kecha va undan oldingi kun o'qilgan bo'lsa — streak 3. Bu odatni mustahkamlash uchun ishlatiladi.

### Reyting

Reyting jadvali o'quvchilarni o'qigan betlari, vaqti va boshqa ko'rsatkichlar bo'yicha tartiblaydi. Maqsad — raqobat emas, balki **motivatsiya**: o'z natijangizni ko'rish va yaxshilash.

### "Battle" — o'quvchilar vs xodimlar

Admin panelida alohida **battle dashboard** bor. Unda ikki jamoa:

- **O'quvchilar** (STUDENT)
- **Xodimlar** (TEACHER, STAFF, BOOK_MANAGER, REGISTRAR)

Faqat **haqiqiy o'qish** hisobga olinadi. Kitobni ochib qo'yish yoki varaqlab chiqish ball bermaydi — minimal betlar soni va vaqt tekshiriladi. Administrator hisobga olinmaydi, u kuzatuvchi.

### Achievementlar

Achievement — bu maxsus yutuq, masalan "Birinchi kitobni tugatdim" yoki "7 kun ketma-ket o'qidim". Ular profil va achievementlar sahifasida ko'rinadi.

---

## 9. Login va xavfsizlik — oddiy tilda

### Login qanday ishlaydi?

1. Siz login va parol kiritasiz.
2. Tizim parolni tekshiradi.
3. To'g'ri bo'lsa, brauzeringizga **"kirish guvohnomasi"** (session cookie) beriladi.
4. Har safar sahifa ochilganda tizim shu guvohnomani tekshiradi.
5. "Chiqish" tugmasini bossangiz, guvohnoma o'chiriladi.

### Nega bu xavfsiz?

- **Parol hech qachon ochiq saqlanmaydi.** U maxsus usulda "maydalanadi" (hash). Hatto administrator ham parolni ko'ra olmaydi.
- **Guvohnoma qalbakilashtirilmaydi.** U maxfiy kalit bilan imzolanadi.
- **Boshqa saytlar sizning nomingizdan amal bajarolmaydi.** Bunga CSRF himoyasi deyiladi.
- **Juda ko'p urinish bloklanadi.** Bunga rate limit deyiladi — masalan, 5 daqiqada 10 marta xato parol kiritilsa, tizim vaqtincha to'xtatadi.
- **Parol o'zgarsa, eski qurilmalardagi sessiyalar bekor bo'ladi.** Bunga session version deyiladi.
- **Har bir rol faqat o'z panelini ko'radi.** Ruxsatlar server tomonda tekshiriladi, shunchaki tugmani yashirish bilan cheklanmaydi.

### Maxfiylik

- O'quvchining shaxsiy ma'lumotlari faqat kerakli xodimlarga ko'rinadi.
- Parollar shifrlangan holda saqlanadi.
- `.env` fayli (maxfiy sozlamalar) hech qachon GitHub'ga yuborilmaydi.
- Audit log kim, qachon, qanday amal bajarganini yozib boradi.

---

## 10. Ko'p so'raladigan savollar

**Savol: Bu dasturmi yoki saytmi?**
Javob: Bu veb-sayt. Brauzerda ochiladi. Telefonga PWA sifatida o'rnatish ham mumkin — shunda oddiy ilovaga o'xshab ishlaydi.

**Savol: Internet bo'lmasa ishlaydimi?**
Javob: Asosiy ish uchun internet kerak, chunki kitoblar va ma'lumotlar serverda. Ayrim statik qismlar keshlanadi, lekin to'liq offline rejim hozircha yo'q.

**Savol: Kitoblar qayerda saqlanadi?**
Javob: PDF fayllar serverda, S3 bulutida yoki ma'lumotlar bazasida saqlanishi mumkin. Bu sozlama (`STORAGE_DRIVER`) orqali tanlanadi. Foydalanuvchi uchun farqi yo'q — u kitobni brauzerda ko'radi.

**Savol: O'quvchi bir vaqtda nechta kitob o'qiy oladi?**
Javob: Odatiy sozlamada **3 ta faol kitob**. Bu cheklov tizim sozlamalaridan o'zgartiriladi.

**Savol: O'qish "soxta" bo'lishi mumkinmi?**
Javob: Tizim buni kamaytirishga harakat qiladi: kitob tugagan hisoblanishi uchun oxirgi betga yetish va yetarli vaqt o'qish kerak. Battle ham faqat minimal bet va vaqtga ega sessiyalarni hisobga oladi.

**Savol: O'qituvchi o'quvchining natijalarini ko'ra oladimi?**
Javob: Ha, statistika va reyting orqali. Har bir foydalanuvchining faolligi admin panelida ham ko'rinadi.

**Savol: Yangi o'quvchi qanday qo'shiladi?**
Javob: Ro'yxatga oluvchi (registrar) yoki administrator yangi akkaunt yaratadi va login/parolni o'quvchiga beradi. O'quvchi o'zi ro'yxatdan o'tishi ham mumkin — ariza tasdiqlanishi kerak.

**Savol: Tizim qaysi tillarda ishlaydi?**
Javob: O'zbek va rus tillarida. Interfeys tilini sozlamalardan almashtirish mumkin.

**Savol: Ma'lumotlar xavfsizmi?**
Javob: Ha, asosiy himoyalar bor: parol hashing, imzolangan sessiya, CSRF, rate limit, rol tekshiruvi, audit log. Batafsil — 2-qismning "Xavfsizlik" bo'limida.

**Savol: Bu loyiha kimga tegishli?**
Javob: MBSI maktabiga. Bu xususiy loyiha, ruxsatsiz tarqatish yoki tijoriy foydalanish taqiqlanadi.

---

## 11. Lug'at — qiyin so'zlar izohi

Agar taqdimotda yoki suhbatda texnik so'z eshitilsa, shu jadvaldan foydalaning.

| So'z | Oddiy izoh |
| --- | --- |
| **Frontend** | Saytning ko'rinadigan qismi — tugmalar, sahifalar, dizayn |
| **Backend** | Saytning "ko'rinmas" qismi — ma'lumotlarni saqlash, tekshirish, hisoblash |
| **Server** | Ma'lumotlarni saqlaydigan va so'rovlarga javob beradigan kompyuter |
| **Ma'lumotlar bazasi (Database)** | Ma'lumotlar saqlanadigan tartibli ombor |
| **API** | Backend bilan frontend o'rtasidagi "ofitsiant" — so'rovni olib, javob qaytaradi |
| **Cookie** | Brauzerdagi kichik "eslatma" — masalan, kirganingizni eslab turadi |
| **Session** | Foydalanuvchining tizimda kirgan holati |
| **Hash** | Parolni bir tomonlama "maydalash" — qaytarib bo'lmaydi |
| **CSRF** | Boshqa sayt sizning nomingizdan amal bajarishining oldini olish |
| **Rate limit** | Juda ko'p so'rov yuborishni cheklash |
| **Deploy** | Loyihani internetga chiqarish |
| **Repository (repo)** | Loyiha fayllari saqlanadigan joy (masalan, GitHub) |
| **Terminal** | Kompyuterga buyruq yoziladigan oyna |
| **npm** | Tayyor kod paketlarini o'rnatadigan vosita |
| **Migratsiya** | Ma'lumotlar bazasi tuzilishini yangilash |
| **Seed** | Bazaga namuna ma'lumotlarni joylash |
| **PDF** | Kitobning elektron fayl formati |
| **PWA** | Saytni telefonga ilova kabi o'rnatish texnologiyasi |
| **Push** | Telefonga keladigan bildirishnoma |
| **AI** | Sun'iy intellekt — masalan, kategoriya tavsiya qilish |

---

# 💻 2-QISM: TEXNIK MA'LUMOT

> Quyidagi bo'limlar dasturchilar va tizim administratorlari uchun. Agar 1-qism yetarli bo'lsa, shu yerdan o'qishni to'xtatishingiz mumkin.

## 12. Texnologiyalar

| Qatlam | Texnologiya | Versiya | Oddiy tilda vazifasi |
| --- | --- | --- | --- |
| Framework | **Next.js** (App Router) | 16.3.2 | Saytning umumiy karkasi: sahifalar, server, API |
| UI | **React** | 19.2.8 | Tugmalar, formalar, interaktiv qismlar |
| Til | **TypeScript** | 5.9.3 | Xatolarni oldindan ushlaydigan JavaScript |
| Stillar | **Tailwind CSS** | 4.3.3 | Dizaynni tez yozish vositasi |
| UI kit | **shadcn + Base UI** | 4.19 / 1.7 | Tayyor, qulay komponentlar |
| Icons | **lucide-react** | 1.33.0 | Ikonkalar |
| State | **Zustand** | 5.0.15 | Brauzerdagi holatni saqlash |
| Validation | **Zod** | 4.4.3 | Kelayotgan ma'lumotni tekshirish |
| ORM | **Prisma** | 6.19.3 | Ma'lumotlar bazasi bilan qulay ishlash |
| DB | **PostgreSQL** | 14+ | Asosiy ma'lumotlar ombori |
| Charts | **Recharts** | 3.10.1 | Admin grafiklari |
| PDF (client) | **pdfjs-dist** | 4.8.69 | Brauzerda PDF ko'rsatish |
| PDF (server) | **mupdf** | 1.28.1 | Serverda PDF tahlili |
| Images | **pngjs** | 7.0.0 | Muqova va rasmlarni qayta ishlash |
| Storage | **AWS SDK S3** | 3.1133 | S3/R2/MinIO fayl ombori |
| Push | **Firebase / Admin** | 12.19 / 14.5 | Telefonga bildirishnoma |
| Auth scaffold | **@supabase/ssr** | 0.12.7 | Ixtiyoriy OAuth/email |
| Notifications | **sonner** | 2.0.8 | Chiroyli toast xabarlar |
| Theme | **next-themes** | 0.4.6 | Kunduzgi/tungi rejim |
| Testing | **Vitest** | 4.1.11 | Avtomatik testlar |
| Lint | **ESLint 9 + next** | 9.39 / 16.3 | Kod sifatini tekshirish |
| Runtime | **Node.js** | 22 LTS | Server ishlaydigan muhit |

> `package.json` da `engines.node = 22`. Node 24 da ham ishlaydi, lekin production uchun **Node 22 LTS** tavsiya etiladi.

---

## 13. O'rnatilgan kutubxonalar

### Asosiy (runtime) paketlar

| Paket | Versiya | Nima uchun kerak? |
| --- | --- | --- |
| `next` | 16.3.2 | App Router, server components, API route'lar |
| `react` / `react-dom` | 19.2.8 | Interfeys runtime'i |
| `@prisma/client` | 6.19.3 | Bazaga yozilgan so'rovlar |
| `prisma` | 6.19.3 | Schema, migratsiya, studio, seed |
| `@base-ui/react` | 1.7.0 | Accessible UI primitivlari |
| `shadcn` | 4.19.0 | Komponent generator/CLI |
| `class-variance-authority` | 0.7.1 | Komponent variantlari |
| `clsx` | 2.1.1 | Shartli class birlashtirish |
| `tailwind-merge` | 3.6.0 | Tailwind class'larini to'g'ri birlashtirish |
| `tw-animate-css` | 1.4.0 | Animatsiyalar |
| `lucide-react` | 1.33.0 | Ikonkalar |
| `next-themes` | 0.4.6 | Theme provider |
| `zustand` | 5.0.15 | Auth store va persist |
| `zod` | 4.4.3 | Request validatsiyasi |
| `sonner` | 2.0.8 | Toast xabarlar |
| `recharts` | 3.10.1 | Grafiklar |
| `pdfjs-dist` | 4.8.69 | PDF render |
| `@aws-sdk/client-s3` | 3.1133.0 | S3/R2 storage |
| `firebase` | 12.19.0 | Client FCM |
| `firebase-admin` | 14.5.0 | Server push |
| `@supabase/ssr` | 0.12.7 | Supabase SSR scaffold |

### Dev paketlar

| Paket | Versiya | Nima uchun? |
| --- | --- | --- |
| `typescript` | 5.9.3 | Type checking |
| `@types/node` | 20.19 | Node type'lari |
| `@types/react` | 19.2.18 | React type'lari |
| `@types/react-dom` | 19.2.4 | React DOM type'lari |
| `tailwindcss` | 4.3.3 | CSS framework |
| `@tailwindcss/postcss` | 4.3.3 | PostCSS plugin |
| `eslint` | 9.39.5 | Linting |
| `eslint-config-next` | 16.3.2 | Next.js lint qoidalari |
| `vitest` | 4.1.11 | Test runner |
| `mupdf` | 1.28.1 | Server PDF processing |
| `pngjs` | 7.0.0 | PNG manipulation |

### Ixtiyoriy / dinamik

| Paket | Holat | Izoh |
| --- | --- | --- |
| `meilisearch` | O'rnatilmagan | `MEILI_HOST` sozlansa dinamik import qilinadi; aks holda PostgreSQL qidiruv |
| `firebase-admin` | O'rnatilgan | `FIREBASE_SERVICE_ACCOUNT_JSON` bo'sh bo'lsa push o'chadi |
| `@supabase/ssr` | O'rnatilgan | Asosiy login custom; Supabase — ixtiyoriy scaffold |

---

## 14. Arxitektura

```text
┌──────────────────────────────────────────────────────────────────┐
│                        BRAUZER / PWA                              │
│  React 19 · Tailwind 4 · Zustand · pdf.js · Service Worker       │
└───────────────────────────────┬──────────────────────────────────┘
                                │ HTTPS
┌───────────────────────────────▼──────────────────────────────────┐
│                     NEXT.JS 16 (App Router)                       │
│                                                                  │
│  src/app/(app)       → o'quvchi sahifalari                       │
│  src/app/(admin)     → admin paneli                              │
│  src/app/(manager)   → kitob menejeri paneli                     │
│  src/app/(registrar) → ro'yxatga oluvchi paneli                  │
│  src/app/(reader)    → full-screen reader                        │
│  src/app/api/*       → REST route handlers                       │
│  src/proxy.ts        → page auth redirect                        │
└───────────────────────────────┬──────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────┐
│                  DOMAIN / SERVICE LAYER                           │
│  src/lib/server/*                                                 │
│  auth · reading · balls · missions · battle · books · search     │
│  storage · pdf · push · audit · settings · stats · guards        │
└───────────────┬───────────────────────────────┬──────────────────┘
                │                               │
┌───────────────▼──────────────┐  ┌─────────────▼──────────────────┐
│  PRISMA ORM + PostgreSQL     │  │  INTEGRATIONS                  │
│  24 model · indekslar        │  │  S3/R2 · FCM · Supabase · AI   │
│  migrations · pool           │  │  Meilisearch (optional)        │
└──────────────────────────────┘  └────────────────────────────────┘
```

### Qatlamlar

1. **Presentation layer** — Next.js App Router. Server Components ma'lumotni to'g'ridan-to'g'ri Prisma orqali oladi; interaktiv qismlar Client Components.
2. **API layer** — `src/app/api/**/route.ts`. Har bir handler `route()` wrapper orqali CSRF, rate-limit, logging va unified error handling oladi.
3. **Domain layer** — `src/lib/server/*`: auth, reading, balls, missions, battle, books, search, storage, pdf, push, audit, system settings.
4. **Data layer** — Prisma → PostgreSQL. 24 model, `0_init` migratsiyasi, indekslar va cascade qoidalari.
5. **Integrations** — S3/R2 (fayllar), Firebase FCM (push), Supabase (ixtiyoriy auth), Groq/OpenAI (AI), Meilisearch (ixtiyoriy qidiruv).

### Next.js 16 o'ziga xosliklari

- `middleware.ts` o'rniga **`src/proxy.ts`** ishlatiladi.
- Next 16.3.2 proxy API route'larga katta POST body'ni to'g'ri uzatmaydi. Shuning uchun API xavfsizligi (CSRF + rate-limit) **`route()` wrapper** ichida amalga oshirilgan.
- `serverExternalPackages` orqali `pdfjs-dist` va `@aws-sdk/client-s3` server bundle'dan tashqarida saqlanadi.
- `outputFileTracingExcludes` katta `storage/` papkasini serverless bundle'dan chiqaradi.

---

## 15. Papka tuzilishi

```text
mbsi-libraryV2/
├── prisma/
│   ├── schema.prisma           # 24 model
│   ├── migrations/0_init/      # boshlang'ich migratsiya
│   ├── seed.mjs                # katalog seed
│   ├── accounts-seed.mjs       # demo akkauntlar
│   └── roles-seed.mjs          # rollar/status backfill
├── public/
│   ├── covers/                 # kitob muqovalari
│   ├── avatars/                # foydalanuvchi avatarlari
│   ├── icons/                  # PWA ikonkalari
│   ├── logo/                   # maktab logotipi
│   ├── pdf-worker/             # pdf.js worker
│   └── manifest.json           # PWA manifest
├── scripts/                    # import, OCR, PDF, diagnostika skriptlari
├── src/
│   ├── app/
│   │   ├── (app)/              # o'quvchi sahifalari
│   │   ├── (admin)/admin/      # admin paneli
│   │   ├── (manager)/manager/  # kitob menejeri paneli
│   │   ├── (registrar)/        # registrar paneli
│   │   ├── (reader)/reader/    # full-screen reader
│   │   ├── api/                # 63 API route
│   │   ├── login/              # login sahifasi
│   │   ├── layout.tsx          # root layout
│   │   └── globals.css         # Tailwind + theme
│   ├── components/
│   │   ├── ui/                 # shadcn/Base UI komponentlar
│   │   ├── layout/             # sidebar, header, shell
│   │   └── *.tsx               # feature komponentlar
│   ├── lib/
│   │   ├── server/             # 34 domain modul
│   │   ├── i18n/               # UZ/RU dictionaries
│   │   ├── auth-store.ts       # Zustand auth
│   │   ├── api-client.ts       # CSRF-aware fetch client
│   │   ├── db.ts               # Prisma singleton + pool
│   │   ├── env.ts              # env parser + defaults
│   │   ├── firebase.ts         # FCM client
│   │   └── validation.ts       # Zod schemas
│   ├── types/                  # shared TypeScript types
│   └── proxy.ts                # page auth redirect
├── tests/                      # Vitest + E2E skriptlar
├── .env.example                # env template (committed)
├── .env                        # local secrets (IGNORED)
├── .gitignore                  # secret/build ignore qoidalari
├── apphosting.yaml             # Firebase App Hosting
├── ecosystem.config.js         # PM2
├── vercel.json                 # Vercel build
├── next.config.ts              # CSP, headers, bundle config
├── vitest.config.ts            # test config
└── package.json                # scripts + dependencies
```

---

## 16. Login va rollar — texnik tafsilot

### Login oqimi

```text
Foydalanuvchi
   │  username + password
   ▼
POST /api/auth/login
   │  1. Zod validation
   │  2. IP bo'yicha rate-limit (10 xato / 5 daqiqa)
   │  3. Prisma: username bo'yicha User
   │  4. scrypt hash + timingSafeEqual
   │  5. sessionVersion tekshiruvi
   ▼
Set-Cookie:
   mbsi_session = userId.v<version>.<HMAC-SHA256>
   mbsi_csrf    = <random payload>.<HMAC>
   │
   ▼
Client (Zustand) → roleHome(role)
   ADMIN → /admin
   BOOK_MANAGER → /manager
   REGISTRAR → /registrar
   boshqalar → /home
```

### Cookie'lar

| Cookie | HttpOnly | SameSite | Muddat | Vazifasi |
| --- | --- | --- | --- | --- |
| `mbsi_session` | ✅ | `Lax` | 24 soat | Sessiya tokeni (HMAC imzolangan) |
| `mbsi_csrf` | ❌ (client o'qiydi) | `Lax` | 24 soat | Double-submit CSRF token |
| `mbsi-lang` | ❌ | `Lax` | 1 yil | Interfeys tili (UZ/RU) |

### Parol xavfsizligi

- **Hash:** `scrypt(password, salt, 64)` → `salt:hash` (hex).
- **Tekshirish:** `crypto.timingSafeEqual` — timing attack oldini oladi.
- **Shifrlangan nusxa:** `passwordEnc` — AES-256-GCM. Faqat ADMIN/REGISTRAR foydalanuvchi yaratganda parolni **bir marta** ko'rsatish uchun. Hash'dan parolni tiklab bo'lmaydi.
- **Session invalidation:** parol o'zgartirilganda `sessionVersion++`; eski tokenlar avtomatik yaroqsiz.
- **Username enumeration:** noto'g'ri login va mavjud bo'lmagan login uchun bir xil xabar.

### Rollar va ruxsatlar

| Rol | Kod | Panel | Ruxsatlar |
| --- | --- | --- | --- |
| O'quvchi | `STUDENT` | `/home` | O'qish, progress, favorites, reviews, missions |
| O'qituvchi | `TEACHER` | `/home` | O'quvchi imkoniyatlari + battle |
| Administrator | `ADMIN` | `/admin` | To'liq boshqaruv |
| Kitob menejeri | `BOOK_MANAGER` | `/manager` | Kitob/kategoriya CRUD |
| Ro'yxatga oluvchi | `REGISTRAR` | `/registrar` | O'quvchi yaratish, arizalar |
| Xodim | `STAFF` | `/home` | O'qish + battle |

Ruxsatlar uch qatlamda tekshiriladi:

1. **`src/proxy.ts`** — protected sahifalarda session cookie bor-yo'qligini tez tekshiradi.
2. **Server layout/guard** — `guardPage()`, `guardAdmin()`, `guardBookManager()`, `guardRegistrar()`.
3. **API handler** — `requireUser()`, `requireAdmin()`, `requireBookManager()`, `requireRegistrar()`, `requireRole()`.

### Supabase (ixtiyoriy)

Loyihada `@supabase/ssr` va quyidagi route'lar mavjud:

- `POST /api/auth/supabase-signin`
- `GET /api/auth/supabase-oauth`
- `GET /api/auth/callback`

Ular **asosiy login oqimiga ulanmagan**. Asosiy auth custom session cookie'da ishlaydi. Supabase OAuth'ni yoqish uchun `.env` da `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` ni to'ldiring va Supabase dashboard'da callback URL'ni qo'shing:

```text
http://localhost:3000/api/auth/callback
https://your-domain.com/api/auth/callback
```

---

## 17. Frontend

### Route groups

| Group | URL | Vazifasi |
| --- | --- | --- |
| `(app)` | `/home`, `/library`, `/books`, `/books/[id]`, `/search`, `/categories`, `/favorites`, `/bookmarks`, `/continue-reading`, `/history`, `/ranking`, `/missions`, `/achievements`, `/statistics`, `/plan`, `/notifications`, `/profile`, `/settings` | O'quvchi interfeysi |
| `(reader)` | `/reader/[id]`, `/reader/[id]/text` | Full-screen PDF/text reader |
| `(admin)` | `/admin`, `/admin/users`, `/admin/users/[id]`, `/admin/students`, `/admin/students/new`, `/admin/students/[id]`, `/admin/students/pending`, `/admin/settings`, `/admin/system`, `/admin/battle` | Admin paneli |
| `(manager)` | `/manager`, `/manager/books`, `/manager/categories` | Kitob menejeri |
| `(registrar)` | `/registrar`, `/registrar/requests`, `/registrar/users` | Ro'yxatga oluvchi |
| — | `/login` | Kirish sahifasi |

### UI/UX

- **shadcn + Base UI** komponentlari: button, input, dialog, sheet, table, tabs, progress, select, tooltip, avatar, badge, skeleton.
- **Tailwind CSS 4** + CSS variables orqali light/dark theme.
- **next-themes** — tizim mavzusini avtomatik aniqlash.
- **lucide-react** ikonkalari.
- **sonner** toast xabarlari.
- **recharts** admin grafiklari.
- Responsive: mobil sidebar/sheet, `viewport-fit=cover`, PWA.
- **i18n:** o'zbek va rus tillari (`src/lib/i18n/dictionaries.ts`).
- **PWA:** `public/manifest.json`, `/sw.js` service worker, offline static cache.
- **PDF reader:** pdf.js, zoom, fit-width/fit-page, fullscreen, sahifa saqlash, sessiya tracking.
- **Text reader:** PDF matni ajratilgan bo'lsa, sahifa bo'yicha matn ko'rinishi.
- **Xavfsizlik:** CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

### O'qish sessiyasi va progress

- Bir vaqtning o'zida maksimal **3 ta faol kitob** (`MAX_ACTIVE_BOOKS`).
- Progress `ReadingProgress` jadvalida saqlanadi (`currentPage`, `progress`, `lastReadAt`).
- Har bir o'qish `ReadingSession` sifatida yoziladi (`startPage`, `endPage`, `pagesRead`, `duration`).
- Kitob "tugatilgan" bo'lishi uchun oxirgi betga yetish + **har bir bet uchun kamida 4 soniya** real o'qish vaqti (min 180 s, max 3600 s). Bu shunchaki varaqlashning oldini oladi.
- Streak — ketma-ket o'qilgan kunlar soni.
- Battle faqat minimal `pagesRead` va `duration` dan o'tgan sessiyalarni hisobga oladi.

---

## 18. Backend va API

### API response formati

Barcha API'lar yagona formatdan foydalanadi:

```json
{
  "success": true,
  "data": {}
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Login va parolni kiriting"
  }
}
```

Asosiy error code'lar: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `INVALID_FILE`, `BOOK_LIMIT_REACHED`, `CONFLICT`, `INTERNAL_ERROR`, `RATE_LIMITED`.

### Auth

| Method | Endpoint | Tavsif |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Username + parol bilan kirish |
| `POST` | `/api/auth/logout` | Sessiyani yopish |
| `GET` | `/api/auth/me` | Joriy foydalanuvchi |
| `DELETE` | `/api/auth/login` | Sessiya cookie'ni tozalash |
| `POST` | `/api/auth/supabase-signin` | Supabase email login (ixtiyoriy) |
| `GET` | `/api/auth/supabase-oauth` | Supabase OAuth URL (ixtiyoriy) |
| `GET` | `/api/auth/callback` | Supabase OAuth callback (ixtiyoriy) |

### Kitoblar va kontent

| Method | Endpoint | Tavsif |
| --- | --- | --- |
| `GET/POST` | `/api/books` | Kitoblar ro'yxati / yaratish |
| `GET/PATCH/DELETE` | `/api/books/[id]` | Bitta kitob CRUD |
| `GET` | `/api/books/[id]/content` | Ajratilgan matn/summary |
| `GET` | `/api/books/[id]/text-page` | Matn rejimi uchun sahifa |
| `GET` | `/api/books/[id]/images` | Kitob rasmlari |
| `POST` | `/api/books/[id]/extract` | PDF matnini ajratish |
| `POST` | `/api/books/[id]/publish` | Publish qilish |
| `POST` | `/api/books/[id]/content/ocr-save` | OCR natijasini saqlash |
| `GET/POST` | `/api/books-v2` | v2 katalog API |
| `GET/PATCH/DELETE` | `/api/books-v2/[id]` | v2 bitta kitob |
| `POST` | `/api/books-v2/sync` | Katalog sinxronizatsiyasi |
| `GET` | `/api/pdf/[id]` | Imzolangan PDF stream (Range) |
| `GET` | `/api/files/[...key]` | Storage fayl stream |

### O'qish

| Method | Endpoint | Tavsif |
| --- | --- | --- |
| `POST/PUT` | `/api/reading/progress` | Progressni yangilash |
| `POST` | `/api/reading/session/start` | Sessiya boshlash |
| `POST` | `/api/reading/session/end` | Sessiya tugatish |
| `GET` | `/api/reading/continue` | Davom ettiriladigan kitoblar |
| `GET` | `/api/reading/completed` | Tugatilgan kitoblar |
| `GET/POST/DELETE` | `/api/reading-goals` | O'qish maqsadlari |

### Foydalanuvchi funksiyalari

| Method | Endpoint | Tavsif |
| --- | --- | --- |
| `GET/POST/DELETE` | `/api/favorites` | Sevimlilar |
| `DELETE/GET` | `/api/favorites/[bookId]` | Bitta sevimli |
| `GET/POST/DELETE` | `/api/bookmarks` | Xatcho'plar |
| `DELETE` | `/api/bookmarks/[id]` | Xatcho'pni o'chirish |
| `GET/POST` | `/api/ratings` | Baholash |
| `GET/POST` | `/api/reviews` | Sharhlar |
| `PATCH/DELETE` | `/api/reviews/[id]` | Sharhni tahrirlash/o'chirish |
| `GET/POST` | `/api/missions` | Missiyalar |
| `POST` | `/api/missions/[id]/claim` | Missiya mukofotini olish |
| `GET` | `/api/ranking` | Reyting |
| `GET` | `/api/stats` | Shaxsiy/platforma statistikasi |
| `GET` | `/api/balls` | Ball tarixi |
| `GET/POST/DELETE` | `/api/notifications` | Bildirishnomalar |
| `POST/DELETE` | `/api/push/subscribe` | FCM obuna |
| `PATCH` | `/api/profile` | Profilni tahrirlash |
| `GET` | `/api/search` | Qidiruv |

### Admin

| Method | Endpoint | Tavsif |
| --- | --- | --- |
| `GET/POST/PATCH` | `/api/admin/users` | Foydalanuvchilar |
| `GET/PATCH/DELETE` | `/api/admin/users/[id]` | Bitta foydalanuvchi |
| `GET` | `/api/admin/users/[id]/activity` | Faoliyat |
| `POST` | `/api/admin/users/[id]/reset-password` | Parolni tiklash |
| `GET` | `/api/admin/students/pending` | Kutilayotgan arizalar |
| `PATCH` | `/api/admin/students/pending/[id]` | Arizani tasdiqlash/rad etish |
| `GET` | `/api/admin/students/credentials` | Login/parol ko'rsatish |
| `PATCH/DELETE` | `/api/admin/books/[id]` | Kitob boshqaruvi |
| `GET` | `/api/admin/books/[id]/stats` | Kitob statistikasi |
| `POST` | `/api/admin/books/suggest-category` | AI kategoriya tavsiyasi |
| `POST` | `/api/admin/categories` | Kategoriya yaratish |
| `DELETE` | `/api/admin/categories/[id]` | Kategoriya o'chirish |
| `GET/PATCH` | `/api/admin/system-settings` | Tizim sozlamalari |
| `GET` | `/api/admin/battle` | Battle dashboard |
| `POST` | `/api/admin/upload` | Fayl yuklash |

### Manager / Registrar

| Method | Endpoint | Tavsif |
| --- | --- | --- |
| `GET` | `/api/manager/books` | Menejer kitob ro'yxati |
| `GET/POST` | `/api/manager/books/import` | Ommaviy import |
| `POST` | `/api/registrar/students` | O'quvchi yaratish |
| `GET` | `/api/registrar/requests` | Arizalar |
| `GET` | `/api/registrar/requests/[id]/credentials` | Login/parol |
| `POST` | `/api/students/pending` | Ariza yuborish |
| `POST` | `/api/upload/image` | Rasm yuklash |

> Barcha API route'lar `route()` wrapper orqali ishlaydi: rate-limit → CSRF → handler → log → unified error.

---

## 19. Ma'lumotlar bazasi

**PostgreSQL + Prisma ORM.** Schema: `prisma/schema.prisma`. Migratsiya: `prisma/migrations/0_init`.

### Modellar

| Model | Jadval | Vazifasi |
| --- | --- | --- |
| `User` | `users` | Foydalanuvchi, rol, profil, ballar, session version |
| `PushSubscription` | `push_subscriptions` | FCM qurilma tokenlari |
| `Notification` | `notifications` | Ichki bildirishnomalar |
| `Author` | `authors` | Mualliflar |
| `Category` | `categories` | Kategoriyalar |
| `Book` | `books` | Kitob, PDF, muqova, til, status |
| `ReadingProgress` | `reading_progress` | Joriy bet/progress |
| `ReadingSession` | `reading_sessions` | O'qish sessiyalari |
| `Bookmark` | `bookmarks` | Xatcho'plar |
| `Favorite` | `favorites` | Sevimlilar |
| `Rating` | `ratings` | 1–5 baho |
| `Review` | `reviews` | Sharhlar |
| `ReadingGoal` | `reading_goals` | O'qish maqsadlari |
| `Mission` | `missions` | Missiyalar |
| `UserMission` | `user_missions` | Olingan missiyalar |
| `Banner` | `banners` | Bosh sahifa bannerlari |
| `Recommendation` | `recommendations` | Tavsiyalar |
| `AuditLog` | `audit_logs` | Audit |
| `StoredFile` | `stored_files` | DB'dagi binary fayllar |
| `BookContent` | `book_contents` | Ajratilgan matn, summary, OCR |
| `BallTransaction` | `ball_transactions` | Ball tarixi |
| `PendingStudent` | `pending_students` | Tasdiqlanmagan o'quvchi arizalari |
| `SearchLog` | `search_logs` | Qidiruv statistikasi |
| `SystemSetting` | `system_settings` | Key-value sozlamalar |

### Muhim qoidalar

- Barcha enum'lar `String` sifatida saqlanadi — provider portability uchun.
- `User.sessionVersion` — sessiyalarni bekor qilish.
- `ReadingProgress(userId, bookId)` — unique.
- `Bookmark(userId, bookId, page)` — unique.
- `Rating/Review(userId, bookId)` — unique.
- `Favorite(userId, bookId)` — unique.
- Cascade: user/book o'chirilganda progress, session, bookmark, favorite, rating, review, notification, ball transaction ham o'chadi.
- Indekslar: `role`, `isActive`, `title`, `authorId`, `categoryId`, `language`, `isPublished`, `status`, `createdAt`, `userId`.

---

## 20. Xavfsizlik

| Himoya | Amalga oshirilishi |
| --- | --- |
| Parol hash | scrypt + random salt + `timingSafeEqual` |
| Parolni ko'rsatish | AES-256-GCM `passwordEnc`, faqat bir marta |
| Sessiya | HMAC-SHA256 imzolangan HttpOnly cookie, 24 soat |
| Sessiya bekor qilish | `sessionVersion` increment |
| CSRF | Double-submit cookie + `x-csrf-token` + HMAC session binding |
| Rate limit | GET 600/min, mutation 120/min, login 10 xato/5 min |
| SQL injection | Prisma parametrlangan so'rovlar |
| XSS | React escaping + CSP (`script-src 'self'`, `object-src 'none'`) |
| Clickjacking | `X-Frame-Options: SAMEORIGIN` |
| MIME sniffing | `X-Content-Type-Options: nosniff` |
| Referrer | `strict-origin-when-cross-origin` |
| Ruxsatlar | Server-side role guard + API `require*()` |
| Fayl access | PDF signed URL + auth + publish state |
| Audit | `AuditLog` (action, entity, metadata) |
| Secretlar | `.env` git'ga tushmaydi; `.env.example` namuna |

### Production tavsiyalari

- `APP_SECRET` ni kamida 32 belgi, random qiling; vaqti-vaqti bilan rotatsiya qiling (bu barcha sessiyalarni bekor qiladi).
- HTTPS majburiy; `secure` cookie avtomatik yoqiladi (`NODE_ENV=production`).
- Rate limitni Redis/WAF bilan kuchaytiring (in-memory limiter har bir instance'da alohida).
- DB backup va monitoring (Sentry/Cloud Logging) qo'shing.
- `.env` faylini hech qachon logga chiqarmang yoki commit qilmang.
- Demo parollarni production'da o'chiring.

---

## 21. O'rnatish

### Talablar

| Talab | Versiya |
| --- | --- |
| Node.js | **22 LTS** (engine) |
| npm | 10+ |
| PostgreSQL | 14+ (16 tavsiya) |
| Git | oxirgi versiya |

### 1. Repo'ni klonlash

```bash
git clone https://github.com/anvarovmuhammadamin011-ops/mbsi-libraryV2.git
cd mbsi-libraryV2
```

### 2. Kutubxonalarni o'rnatish

```bash
npm install
```

`postinstall` avtomatik `scripts/copy-pdf-worker.mjs` ni ishga tushiradi va pdf.js worker'ni `public/pdf-worker/` ga ko'chiradi.

### 3. PostgreSQL bazasini yaratish

Lokal PostgreSQL:

```bash
createdb mbsi_library
```

Yoki Neon/Supabase/Vercel Postgres'dan connection string oling.

### 4. `.env` faylini yaratish

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Keyin `.env` ichida kamida quyidagilarni to'ldiring:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mbsi_library?schema=public"
APP_SECRET="<kamida 32 belgi random>"
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

`APP_SECRET` generatsiyasi:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

### 5. Prisma

```bash
# Client generatsiyasi
npx prisma generate

# Birinchi marta: migratsiyalarni qo'llash
npm run db:migrate

# Yoki tezkor dev uchun (migration fayl yaratmasdan):
npm run db:push
```

Production/existing DB uchun:

```bash
npm run db:deploy
```

### 6. Katalog va demo akkauntlar

```bash
# Real katalog seed (ixtiyoriy)
npm run db:seed

# Demo akkauntlar (admin, student, teacher, staff, kitobmanager, oquvchimanager)
npm run db:accounts
```

### 7. Ishga tushirish

```bash
npm run dev
```

Brauzer: **http://localhost:3000**

### 8. Login

- `admin` / `demo123` → `/admin`
- `student` / `demo123` → `/home`
- `kitobmanager` / `demo123` → `/manager`
- `oquvchimanager` / `demo123` → `/registrar`

---

## 22. .env, .env.example va .gitignore

Bu uch fayl ko'pincha chalkashtiriladi. Oddiy qilib:

| Fayl | Git'ga tushadimi? | Vazifasi | Kim o'qiydi? |
| --- | --- | --- | --- |
| `.env` | ❌ Yo'q (`.gitignore`) | Sizning maxfiy sozlamalaringiz | Faqat sizning kompyuteringiz/server |
| `.env.example` | ✅ Ha | Namuna — qanday sozlamalar kerakligi | Hamma dasturchi |
| `.gitignore` | ✅ Ha | Qaysi fayllar git'ga tushmasligi ro'yxati | Git |

### Qoidalar

1. `.env` ni hech qachon commit qilmang.
2. Yangi env o'zgaruvchi qo'shsangiz, `.env.example` ga ham qo'shing.
3. Production'da qiymatlarni platforma secret manager'i orqali bering (Vercel/Firebase/PM2).
4. `.env` ni o'zgartirgandan keyin dev serverni qayta ishga tushiring.
5. `APP_SECRET` o'zgarsa — barcha sessiyalar va `passwordEnc` nusxalari yaroqsiz bo'ladi.

### `.gitignore` nimalarni istisno qiladi?

- `node_modules/`, `.next/`, `build/`, `out/`
- `.env`, `.env.local`, `.env.production`, `.env.*.local`
- `.vercel/`, `.firebase/`, PM2 loglari
- `storage/private/` (PDF va maxfiy fayllar)
- `prisma/*.db`
- `coverage/`, loglar, `*.tsbuildinfo`
- OS/IDE fayllari (`.DS_Store`, `.idea/`, `.vscode/`)
- `scripts/cache/`, `.freebuff/`

---

## 23. Environment variables

### Asosiy o'zgaruvchilar

| O'zgaruvchi | Majburiy | Default | Tavsif |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `APP_SECRET` | ✅ (prod) | dev fallback | Sessiya/CSRF HMAC kaliti, 32+ belgi |
| `APP_URL` | ⚪ | `http://localhost:3000` | Server URL |
| `NEXT_PUBLIC_APP_URL` | ⚪ | `APP_URL` | OAuth callback uchun public URL |
| `DATABASE_URL_UNPOOLED` | ⚪ | — | Pooler bo'lsa migrate uchun direct URL |
| `PRISMA_CONNECTION_LIMIT` | ⚪ | `10` | Prisma pool limiti |
| `PRISMA_POOL_TIMEOUT` | ⚪ | `30` | Pool timeout (soniya) |
| `RATE_LIMIT_ENABLED` | ⚪ | `true` | Rate limitni yoqish/o'chirish |
| `RATE_LIMIT_READ_MAX` | ⚪ | `600` | GET/min |
| `RATE_LIMIT_READ_WINDOW_MS` | ⚪ | `60000` | GET oyna |
| `RATE_LIMIT_MUTATION_MAX` | ⚪ | `120` | Mutation/min |
| `RATE_LIMIT_MUTATION_WINDOW_MS` | ⚪ | `60000` | Mutation oyna |
| `STORAGE_DRIVER` | ⚪ | `auto` | `auto`, `s3`, `db`, `local` |
| `S3_BUCKET` | ⚪ | — | S3/R2 bucket |
| `S3_REGION` | ⚪ | — | S3 region (`auto` R2 uchun) |
| `S3_ENDPOINT` | ⚪ | — | S3/R2/MinIO endpoint |
| `S3_ACCESS_KEY_ID` | ⚪ | — | S3 access key |
| `S3_SECRET_ACCESS_KEY` | ⚪ | — | S3 secret |
| `S3_PUBLIC_BASE_URL` | ⚪ | — | CDN/public URL |
| `PDF_PUBLIC_BASE` | ⚪ | — | Katta PDF'lar uchun zaxira manba |
| `DEMO_PASSWORD_*` | ⚪ | random | Demo akkaunt parollari |
| `NEXT_PUBLIC_SUPABASE_URL` | ⚪ | — | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⚪ | — | Supabase anon key |
| `NEXT_PUBLIC_FIREBASE_*` | ⚪ | — | FCM client config |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | ⚪ | — | FCM server service account |
| `AI_PROVIDER` | ⚪ | `groq` | AI provider |
| `AI_API_KEY` | ⚪ | — | AI API key |
| `AI_MODEL` | ⚪ | `openai/gpt-oss-120b` | AI model |
| `MEILI_HOST` | ⚪ | — | Meilisearch host |
| `MEILI_API_KEY` | ⚪ | — | Meilisearch key |

> **Minimal ishga tushirish:** `DATABASE_URL`, `APP_SECRET`, `APP_URL`, `NEXT_PUBLIC_APP_URL`. Qolganlari ixtiyoriy — bo'sh bo'lsa tegishli funksiya o'chadi, ilova buzilmaydi.

### `STORAGE_DRIVER` qiymatlari

| Qiymat | Ma'nosi |
| --- | --- |
| `auto` | S3 to'liq sozlangan bo'lsa S3, aks holda DB |
| `s3` | Fayllar S3/R2/MinIO'da |
| `db` | Fayllar PostgreSQL `StoredFile` ichida (BYTEA) |
| `local` | Fayllar server diskida `storage/private/` (faqat lokal/VPS) |

> Serverless (Vercel/Cloud Run) uchun `local` tavsiya etilmaydi — disk vaqtinchalik. `db` yoki `s3` ishlatilsin.

---

## 24. Scripts — buyruqlar

| Script | Buyruq | Vazifasi |
| --- | --- | --- |
| `dev` | `next dev` | Development server |
| `build` | `prisma generate && next build` | Production build |
| `start` | `next start` | Production server |
| `lint` | `eslint` | Lint |
| `typecheck` | `tsc --noEmit` | TypeScript tekshiruvi |
| `test` | `vitest run` | Unit testlar |
| `test:watch` | `vitest` | Watch rejim |
| `db:migrate` | `prisma migrate dev` | Dev migratsiya |
| `db:deploy` | `prisma migrate deploy` | Production migratsiya |
| `db:push` | `prisma db push` | Schema'ni DB'ga tezkor sync |
| `db:seed` | `node prisma/seed.mjs` | Katalog seed |
| `db:accounts` | `node prisma/accounts-seed.mjs` | Demo akkauntlar |
| `db:roles` | `node prisma/roles-seed.mjs` | Rollar/status backfill |
| `db:reset` | `prisma migrate reset --force && node prisma/seed.mjs` | DB reset + seed |
| `db:studio` | `prisma studio` | Prisma GUI |
| `postinstall` | `node scripts/copy-pdf-worker.mjs` | pdf.js worker copy |

### PM2 (VPS)

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 logs mbsi-library
```

> `ecosystem.config.js` hozir `next dev` bilan sozlangan. Production uchun `args` ni `"start"` ga o'zgartiring.

---

## 25. Testlar va sifat tekshiruvi

```bash
npm test
```

Natija (hozirgi holat):

```text
Test Files  3 passed (3)
Tests       20 passed (20)
```

Test fayllari:

| Fayl | Nima tekshiriladi |
| --- | --- |
| `tests/password.test.ts` | scrypt hash/verify, parol generatsiyasi |
| `tests/rate-limit.test.ts` | Fixed-window limiter |
| `tests/session-csrf.test.ts` | Session HMAC, CSRF binding, tamper detection |

Qo'shimcha E2E/probe skriptlar `tests/*.mjs` va `scripts/` ichida (dev server ishlab turgan holatda qo'lda ishga tushiriladi).

### To'liq sifat tekshiruvi

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Hozirgi holat:

| Tekshiruv | Natija |
| --- | --- |
| `tsc --noEmit` | ✅ xatosiz |
| `npm test` | ✅ 20/20 |
| `npm run lint` | ✅ 0 error (5 warning) |
| `npm run build` | ✅ 55 sahifa |
| `prisma validate` | ✅ valid |

ESLint warninglari asosan hook dependency va purity qoidalariga oid; build'ga to'sqinlik qilmaydi.

---

## 26. Deployment — internetga chiqarish

### Vercel

1. Repo'ni Vercel'ga ulang.
2. Environment variables qo'shing:
   - `DATABASE_URL`
   - `APP_SECRET`
   - `APP_URL`
   - `NEXT_PUBLIC_APP_URL`
   - ixtiyoriy: S3, Firebase, AI
3. Build command: `prisma generate && next build` (`vercel.json` da).
4. Deploydan keyin migratsiya:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

5. Demo akkauntlar (ixtiyoriy):

```bash
DATABASE_URL="postgresql://..." node prisma/accounts-seed.mjs
```

**Eslatma:** Vercel Hobby funksiyasi 4.5 MB dan katta buffer javob bera olmaydi. PDF'lar stream qilinadi; katta fayllar uchun `PDF_PUBLIC_BASE` yoki S3 ishlatiladi.

### Firebase App Hosting

Repo'da `apphosting.yaml` tayyor:

- Node.js 22 tanlang.
- Secretlar:

```bash
firebase apphosting:secrets:set DATABASE_URL
firebase apphosting:secrets:set APP_SECRET
```

- `STORAGE_DRIVER=db` yoki `s3` (Cloud Run diski vaqtinchalik; `local` ishlatilmaydi).
- `NEXT_PUBLIC_FIREBASE_*` va `FIREBASE_SERVICE_ACCOUNT_JSON` bo'sh bo'lsa push o'chadi.
- Muqovalar S3/CDN'dan berilsa, `next.config.ts` dagi CSP `img-src` ga domenni qo'shing.

### VPS / PM2

```bash
npm ci
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Production'da `args: "start"` ishlatilsin. Nginx reverse proxy + HTTPS tavsiya etiladi.

---

## 27. Performance va scaling

- **Prisma connection pool:** `connection_limit` va `pool_timeout` URL'ga avtomatik qo'shiladi (`src/lib/db.ts`).
- **Serverless:** Neon/Supabase pooler bilan ishlash uchun `?pgbouncer=true` va `connection_limit` sozlanadi.
- **DB indekslari:** role, status, language, createdAt, userId, bookId va boshqalar.
- **PDF streaming:** buffer emas, `ReadableStream` + HTTP Range; katta fayllar uchun xotira tejaladi.
- **S3/CDN:** katta fayllarni CDN orqali berish.
- **`outputFileTracingExcludes`:** `storage/` serverless bundle'ga kirmaydi.
- **`serverExternalPackages`:** pdfjs/AWS SDK bundle hajmini kamaytiradi.
- **Meilisearch (ixtiyoriy):** katta katalogda tez full-text qidiruv; bo'lmasa PostgreSQL fallback.
- **PWA cache:** faqat statik resurslar; API va navigatsiya keshdan berilmaydi.

### Cheklovlar

- In-memory rate limiter har bir instance'da alohida; ko'p instance'li production uchun Redis/WAF tavsiya etiladi.
- `prisma db push` production uchun emas — `migrate deploy` ishlatilsin.
- PDF OCR to'liq server-side emas; matn bo'lmagan PDF'lar uchun client-side OCR oqimi mavjud.

---

## 28. Muammolarni bartaraf etish

| Muammo | Sabab | Yechim |
| --- | --- | --- |
| `P1001: Can't reach database server` | DB ishlamayapti yoki URL xato | PostgreSQL'ni ishga tushiring, `DATABASE_URL` ni tekshiring |
| `P1012: Environment variable not found` | `.env` yo'q yoki to'liq emas | `.env.example` dan nusxa oling, to'ldiring |
| `APP_SECRET production'da majburiy` | 32 belgidan kam | Random 48+ belgi qo'ying |
| Login ishlamaydi | Demo akkauntlar yaratilmagan | `npm run db:accounts` |
| Login "noto'g'ri" | Parol yoki username xato | `.env` dagi `DEMO_PASSWORD_*` ni tekshiring |
| 403 `Ruxsat yo'q (CSRF)` | CSRF cookie yo'q yoki eski sessiya | Qayta login qiling |
| 429 `RATE_LIMITED` | So'rovlar limiti oshdi | 1 daqiqa kuting yoki limitni oshiring |
| PDF 403 | Imzo muddati o'tgan yoki ruxsat yo'q | Sahifani yangilang, qayta login qiling |
| PDF 404 | Fayl storage'da yo'q | `storage/private/`, S3 yoki `PDF_PUBLIC_BASE` ni tekshiring |
| Rasmlar ko'rinmaydi | CSP `img-src` bloklaydi | `next.config.ts` ga domenni qo'shing |
| Push ishlamaydi | Firebase env bo'sh | `NEXT_PUBLIC_FIREBASE_*` va service account qo'shing |
| `next build` juda katta | `storage/` bundle'ga tushgan | `outputFileTracingExcludes` ni tekshiring |
| Next 16 API body yo'qoladi | proxy API route'larga body uzatmaydi | `route()` wrapper ishlatilgan; matcher'ga API qo'shmang |

---

## 29. Taqdimot uchun materiallar

Bu bo'limni taqdimotdan oldin bir marta o'qib chiqish tavsiya etiladi. Matnlarni o'zgartirib gapirish mumkin.

### 30 soniyalik pitch

> **MBSI Library** — maktab kutubxonasini raqamlashtiradigan yagona platforma. O'quvchi istalgan qurilmada PDF kitob o'qiydi, progressi avtomatik saqlanadi, ball va missiyalar orqali motivatsiya oladi. Admin va kitob menejeri fondni, foydalanuvchilarni va statistikani real vaqtda boshqaradi. Tizim Next.js 16, PostgreSQL va Prisma asosida qurilgan, xavfsiz sessiya, CSRF va rate-limit bilan himoyalangan.

### 10–12 slaydli taqdimot rejasi

| # | Slayd | Asosiy fikrlar |
| --- | --- | --- |
| 1 | **Titul** | MBSI Library, logo, muallif, sana |
| 2 | **Muammo** | Tarqoq PDF'lar, progress yo'q, hisobot qo'lda, motivatsiya past |
| 3 | **Yechim** | Yagona raqamli kutubxona + gamifikatsiya + analitika |
| 4 | **Foydalanuvchilar** | 6 rol: o'quvchi, o'qituvchi, admin, kitob menejeri, registrar, xodim |
| 5 | **Asosiy oqim** | Login → katalog → reader → progress → ball/missiya → reyting |
| 6 | **Arxitektura** | Next.js 16 → API → Prisma → PostgreSQL; S3/FCM/AI |
| 7 | **Xavfsizlik** | scrypt, HMAC sessiya, CSRF, rate limit, CSP, audit |
| 8 | **Gamifikatsiya** | Ballar 0–12, missiyalar, achievementlar, student vs staff battle |
| 9 | **Analitika** | Admin KPI, kitob statistikasi, o'qish sessiyalari, reyting |
| 10 | **Texnologiyalar** | Next 16, React 19, TS, Prisma, Tailwind 4, pdf.js |
| 11 | **Natijalar** | 24 model, 63 API route, 38 sahifa, 20 test, PWA |
| 12 | **Yo'l xaritasi / Q&A** | Supabase OAuth, Redis limit, Meilisearch, monitoring |

### 2 daqiqalik demo stsenariysi

1. **Login:** `student` / `demo123` (yoki tezkor tugma).
2. **Bosh sahifa:** tavsiyalar, davom ettirish, kategoriyalar.
3. **Katalog:** qidiruv va filtr.
4. **Reader:** PDF ochish, sahifani o'zgartirish, progress saqlanishi.
5. **Profil/statistika:** o'qilgan betlar, streak, ballar.
6. **Missiyalar:** missiya holati va mukofot olish.
7. **Reyting:** o'quvchilar jadvali.
8. **Admin:** `admin` / `demo123` → KPI, foydalanuvchilar, kitoblar.
9. **Kitob menejeri:** `kitobmanager` / `demo123` → kitob qo'shish/import.
10. **Registrar:** `oquvchimanager` / `demo123` → yangi o'quvchi yaratish.

### Tez-tez so'raladigan savollar (Q&A)

**Savol:** Ma'lumotlar qayerda saqlanadi?
**Javob:** PostgreSQL'da, Prisma ORM orqali. PDF'lar S3/R2, Postgres BYTEA yoki lokal diskda saqlanishi mumkin (`STORAGE_DRIVER`).

**Savol:** Nega Next.js?
**Javob:** Server Components, API route'lar, SSR va PWA bir framework'da; Vercel/App Hosting bilan oson deploy.

**Savol:** Xavfsizlik qanday ta'minlangan?
**Javob:** scrypt parol hash, HMAC sessiya, CSRF double-submit, rate limit, CSP, role guard, audit log.

**Savol:** Kelajakda nima qo'shiladi?
**Javob:** Supabase OAuth'ni tugatish, Redis rate-limit, Meilisearch, mobil PWA yaxshilash, monitoring va backup.

---

## 30. Yo'l xaritasi

- [ ] Supabase OAuth/email integratsiyasini to'liq tugatish yoki scaffold'ni olib tashlash.
- [ ] Parolni tiklash (email verification / reset password).
- [ ] Redis asosidagi rate limiting.
- [ ] Meilisearch'ni production'da yoqish.
- [ ] S3/CDN'ni standart storage qilish.
- [ ] Test coverage'ni oshirish (API integration, E2E).
- [ ] Monitoring (Sentry) va structured logging.
- [ ] DB backup/restore avtomatizatsiyasi.
- [ ] Accessibility (WCAG) auditi.
- [ ] Mobil PWA offline rejimini kengaytirish.

---

## 31. Litsenziya va aloqa

Bu **xususiy (private)** loyiha. Mualliflik huquqi **MBSI maktabi**ga tegishli. Ruxsatsiz tarqatish yoki tijoriy foydalanish taqiqlanadi.

- **Repository:** [github.com/anvarovmuhammadamin011-ops/mbsi-libraryV2](https://github.com/anvarovmuhammadamin011-ops/mbsi-libraryV2)
- **Stack:** Next.js 16 · React 19 · TypeScript · Prisma · PostgreSQL · Tailwind CSS 4
- **Savollar:** loyiha maintainer'iga murojaat qiling.

---

<p align="center">
  <strong>MBSI Library</strong> — bilimga yo'l oching 📖
</p>
