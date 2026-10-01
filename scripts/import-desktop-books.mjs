// Desktop/books dagi 24 ta PDF ni ilovaga import qilish.
// - PDF storage/private/pdfs/<slug>.pdf ga nusxalanadi
// - Muallif topilmasa yaratiladi, kitob slug bo'yicha upsert qilinadi
// Run: node scripts/import-desktop-books.mjs (commit/push yo'q)
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DESKTOP_BOOKS = "C:\\Users\\Victus\\Desktop\\books";
const PDF_DIR = path.join(process.cwd(), "storage", "private", "pdfs");

function slugify(s) {
  return (
    s
      .toLowerCase()
      .replace(/['ʼ`’]/g, "")
      .replace(/[^a-z0-9\u0400-\u04ff\ufb00-\ufdff\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "kitob"
  );
}

// authorMatch: mavjud muallif ismidagi kalit (kichik harf) — topilmasa newAuthor yaratiladi
const BOOKS = [
  { file: "%40KutubxonaaN1Jorj-Oruell-Molxona.pdf", title: "Hayvonlar xo'jaligi (Molxona)", authorMatch: "orwell", newAuthor: null, cat: "badiiy-adabiyot", desc: "Jorj Oruellning mashhur satirik qissasi — Molxona orqali jamiyat illatlari fosh etiladi." },
  { file: "Andisha-va-gurur.pdf", title: "Andisha va g'urur", authorMatch: null, newAuthor: { name: "Jane Austen", bio: "English novelist, author of Pride and Prejudice." }, cat: "badiiy-adabiyot", desc: "Jahon adabiyotining sevgi va jamiyat haqidagi klassik romani." },
  { file: "Belyaev-Aleksandr.-Kets-yulduzi.pdf", title: "KETS yulduzi", authorMatch: null, newAuthor: { name: "Aleksandr Belyayev", bio: "Russian science fiction writer." }, cat: "badiiy-adabiyot", desc: "Koinot va ilmiy sarguzashtlar haqida fantastik roman." },
  { file: "Bulgakov-It-yurak.pdf", title: "It yurak", authorMatch: "bulgakov", newAuthor: null, cat: "badiiy-adabiyot", desc: "Mixail Bulgakovning ilm-fan va insoniyat haqidagi satirik qissasi." },
  { file: "Kaykovus-Qobusnoma.pdf", title: "Qobusnoma", authorMatch: null, newAuthor: { name: "Kaykovus", bio: "XI asr adibi, Qobusnoma pandnomasining muallifi." }, cat: "badiiy-adabiyot", desc: "Sharqning mashhur pandnomasi — hayot odoblari haqida nasihatlar." },
  { file: "Lutfiy-Gul-va-Navroz.pdf", title: "Gul va Navro'z", authorMatch: null, newAuthor: { name: "Lutfiy", bio: "O'zbek mumtoz shoiri." }, cat: "ozbek-adabiyoti", desc: "Lutfiyning muhabbat haqidagi mumtoz dostoni." },
  { file: "Mark-Tven-Tom-Soyerning-yangi-sarguzashtlari-qissa.pdf", title: "Tom Soyerning yangi sarguzashtlari", authorMatch: "mark tven", newAuthor: null, cat: "badiiy-adabiyot", desc: "Tom Soyerning qiziqarli sarguzashtlari haqida qissa." },
  { file: "Mirach-Chagriy-Oqtosh-Tosiqlarga-qaramay-sevdik.pdf", title: "To'siqlarga qaramay sevdik", authorMatch: null, newAuthor: { name: "Mirach Chag'riy", bio: "Contemporary author." }, cat: "badiiy-adabiyot", desc: "Muhabbat va hayot sinovlari haqidagi roman." },
  { file: "Mirkarim-Osim-Zulmat-ichra-nur-qissa.pdf", title: "Zulmat ichra nur", authorMatch: "mirkarim osim", newAuthor: null, cat: "ozbek-adabiyoti", desc: "Mirkarim Osimning tarixiy qissasi." },
  { file: "Mixail-Bulgakov-Usta-va-Margarita-roman.pdf", title: "Usta va Margarita", authorMatch: "bulgakov", newAuthor: null, cat: "badiiy-adabiyot", desc: "Bulgakovning eng mashhur mistik-falsafiy romani." },
  { file: "Muhammad-Yusuf-Xalq-bol-Elim.pdf", title: "Xalq bo'l, elim", authorMatch: null, newAuthor: { name: "Muhammad Yusuf", bio: "O'zbek xalq shoiri." }, cat: "ozbek-adabiyoti", desc: "Muhammad Yusufning eng sara she'rlari va dostonlari to'plami." },
  { file: "Odil-Yoqubov-Ulugbek-xazinasi-roman.pdf", title: "Ulug'bek xazinasi", authorMatch: "odil yoqubov", newAuthor: null, cat: "ozbek-adabiyoti", desc: "Ulug'bek davri va ilm-fan fidoyilari haqidagi tarixiy roman." },
  { file: "Odil-Yoqubov.-Kohna-dunyo-roman.pdf", title: "Kohna dunyo", authorMatch: "odil yoqubov", newAuthor: null, cat: "ozbek-adabiyoti", desc: "Odil Yoqubovning tarixiy romani." },
  { file: "Otkir-Hoshimov-Bahor-qaytmaydi.pdf", title: "Bahor qaytmaydi", authorMatch: "hoshimov", newAuthor: null, cat: "ozbek-adabiyoti", desc: "O'tkir Hoshimovning mashhur romani." },
  { file: "Otkir-Hoshimov-Ikki-eshik-orasi.pdf", title: "Ikki eshik orasi", authorMatch: "hoshimov", newAuthor: null, cat: "ozbek-adabiyoti", desc: "O'tkir Hoshimovning hayot va taqdir haqidagi romani." },
  { file: "Oybek-Navoiy-roman.pdf", title: "Navoiy", authorMatch: "oybek", newAuthor: null, cat: "ozbek-adabiyoti", desc: "Oybekning Alisher Navoiy haqidagi tarixiy-biografik romani." },
  { file: "Paolo-Koelo.-Alkimyogar-roman.pdf", title: "Alkimyogar", authorMatch: "coelho", newAuthor: null, cat: "badiiy-adabiyot", desc: "Paulo Coelhoning o'z orzusini izlovchi cho'pon haqidagi mashhur romani (o'zbek tilida)." },
  { file: "Pirimqul-Qodirov-Yulduzli-tunlar-roman.pdf", title: "Yulduzli tunlar", authorMatch: "pirimqul", newAuthor: null, cat: "ozbek-adabiyoti", desc: "Pirimqul Qodirovning tarixiy romani." },
  { file: "Qiz-bolaga-tosh-otmang.pdf", title: "Qiz bolaga tosh otmang", authorMatch: "xudoyberdi", newAuthor: null, cat: "ozbek-adabiyoti", desc: "Xudoyberdi To'xtaboyevning mustaqillik davri yoshlari haqidagi romanlari to'plami." },
  { file: "Sadiy-Sheroziy-Guliston.pdf", title: "Guliston", authorMatch: "sa'diy", newAuthor: null, cat: "badiiy-adabiyot", desc: "Sa'diy Sheroziying hikmatli hikoyatlar to'plami." },
  { file: "Shuhrat-Oltin-zanglamas.pdf", title: "Oltin zanglamas", authorMatch: null, newAuthor: { name: "Shuhrat", bio: "O'zbek yozuvchisi." }, cat: "ozbek-adabiyoti", desc: "Shuhratning mashhur romani." },
  { file: "Stendal-Qizil-va-qora-roman.pdf", title: "Qizil va qora", authorMatch: null, newAuthor: { name: "Stendal", bio: "French writer, author of The Red and the Black." }, cat: "badiiy-adabiyot", desc: "Fransuz adabiyotining klassik romani." },
  { file: "Togay-Murod-Yulduzlar-mangu-yonadi.pdf", title: "Yulduzlar mangu yonadi", authorMatch: null, newAuthor: { name: "Tog'ay Murod", bio: "O'zbek yozuvchisi." }, cat: "ozbek-adabiyoti", desc: "Tog'ay Murodning qishloq hayoti haqidagi asari." },
  { file: "Vilyam-Shekspir-Hamlet-tragediya.pdf", title: "Hamlet", authorMatch: null, newAuthor: { name: "Uilyam Shekspir", bio: "English playwright and poet." }, cat: "badiiy-adabiyot", desc: "Shekspirning mashhur tragediyasi (o'zbek tilida)." },
];

async function detectPages(buf) {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buf),
      isEvalSupported: false,
      useSystemFonts: false,
    }).promise;
    const n = doc.numPages;
    await doc.destroy();
    return n > 0 ? n : 100;
  } catch {
    return 100;
  }
}

async function main() {
  fs.mkdirSync(PDF_DIR, { recursive: true });
  const authors = await prisma.author.findMany();
  const categories = await prisma.category.findMany();
  const findAuthor = (key) => {
    const k = key.toLowerCase().replace(/['ʼ`’]/g, "");
    return authors.find((a) =>
      a.name.toLowerCase().replace(/['ʼ`’]/g, "").includes(k)
    );
  };

  let ok = 0;
  for (let i = 0; i < BOOKS.length; i++) {
    const b = BOOKS[i];
    const src = path.join(DESKTOP_BOOKS, b.file);
    if (!fs.existsSync(src)) {
      console.log(`SKIP (topilmadi): ${b.file}`);
      continue;
    }
    const slug = slugify(b.title);
    const dest = path.join(PDF_DIR, `${slug}.pdf`);
    fs.copyFileSync(src, dest);
    const buf = fs.readFileSync(dest);
    const pages = await detectPages(buf);

    let author = b.authorMatch ? findAuthor(b.authorMatch) : null;
    if (!author && b.newAuthor) {
      author =
        findAuthor(b.newAuthor.name) ??
        (await prisma.author.create({
          data: { name: b.newAuthor.name, biography: b.newAuthor.bio },
        }));
      authors.push(author);
    }
    if (!author) {
      console.log(`SKIP (muallif topilmadi): ${b.title}`);
      continue;
    }
    const category = categories.find((c) => c.slug === b.cat);
    if (!category) {
      console.log(`SKIP (kategoriya topilmadi): ${b.title}`);
      continue;
    }

    await prisma.book.upsert({
      where: { slug },
      create: {
        id: `book-imp-${i + 1}`,
        title: b.title,
        slug,
        description: b.desc,
        coverUrl: null,
        pdfUrl: `pdfs/${slug}.pdf`,
        language: "UZ",
        totalPages: pages,
        fileSize: buf.length,
                authorId: author.id,
        categoryId: category.id,
        isPublished: true,
      },
      update: {
        description: b.desc,
        pdfUrl: `pdfs/${slug}.pdf`,
        totalPages: pages,
        fileSize: buf.length,
        authorId: author.id,
        categoryId: category.id,
        isPublished: true,
      },
    });
    console.log(`OK: ${b.title} — ${author.name} (${pages} bet)`);
    ok++;
  }
  console.log(`\nTayyor: ${ok}/${BOOKS.length} kitob qo'shildi.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
