#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

function slugify(input) {
  return input.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-") || "book";
}
function colorFor(str) {
  const colors = ["#2563eb","#059669","#7c3aed","#dc2626","#ea580c","#0891b2","#9333ea","#b45309","#0d9488","#1e40af","#be185d","#4338ca"];
  let h=0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))>>>0;
  return colors[h%colors.length];
}
function coverSvg(title, color) {
  const t = title.length>22 ? title.slice(0,22)+"…" : title;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533"><rect width="400" height="533" fill="${color}"/><text x="200" y="220" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="24" font-weight="bold">${t}</text><text x="200" y="280" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui,sans-serif" font-size="14">MBSI Library</text><rect x="150" y="340" width="100" height="3" rx="1.5" fill="rgba(255,255,255,0.4)"/></svg>`;
}

// Minimal PDF Writer (same as generate-pdfs.mjs simplified)
class PDFWriter {
  constructor(){ this.objects=[]; this.pages=[]; this.cur=[]; this.y=720; this.objects.push(null);}
  addObject(o){ this.objects.push(o); return this.objects.length; }
  newPage(){ if(this.cur.length>0) this._endPage(); this.cur=[]; this.y=720; }
  text(str, opts={}){ const size=opts.size||12; const bold=opts.bold||false; const font=bold?"F2":"F1"; const maxW=opts.maxWidth||480; const lh=size*1.4; const lines=this._wrap(str,size,maxW); for(const line of lines){ if(this.y<72){ this._endPage(); this.cur=[]; this.y=720; } const esc=line.replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)"); this.cur.push(`BT ${font} ${size} Tf 72 ${this.y} Td (${esc}) Tj ET`); this.y-=lh; } }
  _endPage(){ const content=this.cur.join("\n"); const id=this.addObject({type:"stream", data:content}); this.pages.push(id); }
  toBuffer(){ if(this.cur.length>0) this._endPage(); let offsets=[]; let pdf="%PDF-1.4\n"; for(let i=1;i<this.objects.length;i++){ offsets.push(pdf.length); const o=this.objects[i]; if(o.type==="stream") pdf+=`${i} 0 obj\n<< /Length ${o.data.length} >>\nstream\n${o.data}\nendstream\nendobj\n\n`; else pdf+=`${i} 0 obj\n${o.data}\nendobj\n\n`; } const f1=this.objects.length; offsets.push(pdf.length); pdf+=`${f1} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n\n`; const f2=f1+1; offsets.push(pdf.length); pdf+=`${f2} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n\n`; const pagesId=f2+1; offsets.push(pdf.length); const kids=this.pages.map(id=>`${id} 0 R`).join(" "); pdf+=`${pagesId} 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${this.pages.length} >>\nendobj\n\n`; const pageIds=[]; for(const cid of this.pages){ const pid=this.objects.length+1+pageIds.length; pageIds.push(pid); offsets.push(pdf.length); pdf+=`${pid} 0 obj\n<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Contents ${cid} 0 R /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> >>\nendobj\n\n`; } const catId=this.objects.length+1+pageIds.length; offsets.push(pdf.length); pdf+=`${catId} 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj\n\n`; const xref=pdf.length; const total=catId+1; pdf+=`xref\n0 ${total}\n0000000000 65535 f \n`; for(const off of offsets) pdf+=String(off).padStart(10,"0")+" 00000 n \n"; pdf+=`trailer\n<< /Size ${total} /Root ${catId} 0 R >>\nstartxref\n${xref}\n%%EOF`; return Buffer.from(pdf,"latin1"); }
  _wrap(str, size, maxW){ const cw=size*0.5; const mc=Math.floor(maxW/cw); const words=str.split(" "); const lines=[]; let line=""; for(const w of words){ if((line+" "+w).trim().length>mc && line){ lines.push(line.trim()); line=w; } else line=line?line+" "+w:w; } if(line) lines.push(line.trim()); return lines.length?lines:[""]; }
}

const CATEGORIES = [
  { id:"cat-9", name:"Rus adabiyoti", slug:"rus-adabiyoti", description:"Rus mumtoz adabiyoti durdonalari", icon:"🇷🇺" },
  { id:"cat-10", name:"Jahon adabiyoti", slug:"jahon-adabiyoti", description:"Dunyo adabiyotining eng sara asarlari", icon:"🌍" },
];

const BOOKS = [
  // O'zbek adabiyoti (14 yangi, o'tkan kunlar mavjud)
  { id:"book-25", title:"Mehrobdan chayon", author:"Abdulla Qodiriy", cat:"cat-3", lang:"UZ", pages:320, desc:"Abdulla Qodiriyning tarixiy romani. O'rta Osiyo xonliklari davridagi murakkab siyosiy va ijtimoiy hayot tasvirlangan." },
  { id:"book-26", title:"Ikki eshik orasi", author:"O'tkir Hoshimov", cat:"cat-3", lang:"UZ", pages:280, desc:"Urush yillaridagi o'zbek oilasining taqdiri, insoniy qadriyatlar va sabr-toqat haqida ta'sirchan roman." },
  { id:"book-27", title:"Yulduzli tunlar", author:"Pirimqul Qodirov", cat:"cat-3", lang:"UZ", pages:260, desc:"Bobur Mirzo hayoti haqida badiiy-tarixiy roman. Shoir va sarkarda ruhiyati chuqur ochilgan." },
  { id:"book-28", title:"Boburnoma", author:"Zahiriddin Muhammad Bobur", cat:"cat-3", lang:"UZ", pages:400, desc:"Buyuk sarkarda va shoir Boburning o'zi yozgan memuar. Markaziy Osiyo va Hindiston tarixi bebaho manbasi." },
  { id:"book-29", title:"Navoiy", author:"Oybek", cat:"cat-3", lang:"UZ", pages:310, desc:"Alisher Navoiy siymosi va ijodi haqida roman. Ulug' shoirning ma'naviy olami yoritilgan." },
  { id:"book-30", title:"Ulug'bek xazinasi", author:"Odil Yoqubov", cat:"cat-3", lang:"UZ", pages:340, desc:"Mirzo Ulug'bek va uning ilmiy merosi haqida tarixiy roman. Samarqand rasadxonasi fojiasi." },
  { id:"book-31", title:"Shum bola", author:"G'afur G'ulom", cat:"cat-3", lang:"UZ", pages:180, desc:"Bolalikning sho'x va quvnoq olami. Qoravoy ismli bolaning sarguzashtlari kulgili va ibratli." },
  { id:"book-32", title:"Sariq devni minib", author:"Xudoyberdi To'xtaboyev", cat:"cat-3", lang:"UZ", pages:200, desc:"Bolalar uchun yozilgan fantastik-sarguzasht asar. Orzular va jasorat haqida kitob." },
  { id:"book-33", title:"Sariq devning o'limi", author:"Xudoyberdi To'xtaboyev", cat:"cat-3", lang:"UZ", pages:210, desc:"Sariq dev haqidagi trilogiyaning davomi. Yovuzlik ustidan yaxshilikning g'alabasi." },
  { id:"book-34", title:"Besh bolali yigitcha", author:"Xudoyberdi To'xtaboyev", cat:"cat-3", lang:"UZ", pages:190, desc:"Mehnatsevar yigitcha va uning oilasi haqida tarbiyaviy qissa." },
  { id:"book-35", title:"Kichkina shahzoda", author:"Antoine de Saint-Exupéry", cat:"cat-3", lang:"UZ", pages:96, desc:"Dunyo adabiyotining durdonasi o'zbek tilida. Do'stlik, muhabbat va insoniylik haqida falsafiy ertak." },
  { id:"book-36", title:"Mahbub ul-qulub", author:"Alisher Navoiy", cat:"cat-3", lang:"UZ", pages:250, desc:"Navoiyning axloqiy-falsafiy asari. Inson qalbining go'zalligi va jamiyat turlari tahlil qilingan." },
  { id:"book-37", title:"Qutadg'u bilig", author:"Yusuf Xos Hojib", cat:"cat-3", lang:"UZ", pages:300, desc:"XI asrda yozilgan qomusiy asar. Adolat, davlat boshqaruvi va axloq haqida pandnoma." },
  // Rus adabiyoti
  { id:"book-38", title:"Jinoyat va jazo", author:"Fyodor Dostoyevskiy", cat:"cat-9", lang:"RU", pages:600, desc:"Raskolnikovning jinoyati va vijdon azobi. Rus adabiyotining eng chuqur psixologik romani." },
  { id:"book-39", title:"Oq tunlar", author:"Fyodor Dostoyevskiy", cat:"cat-9", lang:"RU", pages:120, desc:"Orzuchan yigit va yolg'iz qizning Peterburgdagi oq tunlardagi uchrashuvi. Lirrik qissa." },
  { id:"book-40", title:"Kambag'allar", author:"Fyodor Dostoyevskiy", cat:"cat-9", lang:"RU", pages:180, desc:"Dostoyevskiyning ilk romani. Kambag'al amaldor Makar Devushkinning ayanchli taqdiri." },
  { id:"book-41", title:"Urush va tinchlik", author:"Lev Tolstoy", cat:"cat-9", lang:"RU", pages:1200, desc:"1812-yilgi urush fonida rus jamiyati panoramasi. Dunyo adabiyotining eng yirik epik romani." },
  { id:"book-42", title:"Anna Karenina", author:"Lev Tolstoy", cat:"cat-9", lang:"RU", pages:800, desc:"Sevgi, oila va jamiyat bosimi o'rtasidagi fojia. Anna va Vronskiy ishqi." },
  { id:"book-43", title:"Tirilish", author:"Lev Tolstoy", cat:"cat-9", lang:"RU", pages:450, desc:"Gunoh, tavba va ma'naviy tirilish haqida roman. Nexlyudov va Katyusha taqdiri." },
  { id:"book-44", title:"Ota va bolalar", author:"Ivan Turgenev", cat:"cat-9", lang:"RU", pages:280, desc:"Avlodlar o'rtasidagi ziddiyat. Bazarov - nihilist yigitning fojiasi." },
  { id:"book-45", title:"Yevgeniy Onegin", author:"Aleksandr Pushkin", cat:"cat-9", lang:"RU", pages:240, desc:"She'riy roman. Onegin va Tatyana muhabbati - rus ruhining qomusi." },
  { id:"book-46", title:"Kapitan qizi", author:"Aleksandr Pushkin", cat:"cat-9", lang:"RU", pages:180, desc:"Pugachev qo'zg'oloni davridagi sevgi va sadoqat qissasi." },
  { id:"book-47", title:"Zamonamiz qahramoni", author:"Mixail Lermontov", cat:"cat-9", lang:"RU", pages:220, desc:"Pechorin - ortiqcha odam obrazi. Rus jamiyatining ruhiy portreti." },
  { id:"book-48", title:"Revizor", author:"Nikolay Gogol", cat:"cat-9", lang:"RU", pages:120, desc:"Mayda amaldorlarning qo'rquvi va ma'muriy korrupsiyani fosh etuvchi komediya." },
  { id:"book-49", title:"O'lik jonlar", author:"Nikolay Gogol", cat:"cat-9", lang:"RU", pages:350, desc:"Chichikovning o'lik jonlarni sotib olishi - krepostnoylik jamiyatining satirasi." },
  { id:"book-50", title:"Chexov hikoyalari", author:"Anton Chexov", cat:"cat-9", lang:"RU", pages:300, desc:"Buyuk hikoyanavisning eng sara hikoyalari to'plami. Inson qalbining nozik tasviri." },
  { id:"book-51", title:"It yurak", author:"Mixail Bulgakov", cat:"cat-9", lang:"RU", pages:150, desc:"Itni odamga aylantirish tajribasi - ilm-fan va axloq chegarasi haqida satirik qissa." },
  { id:"book-52", title:"Usta va Margarita", author:"Mixail Bulgakov", cat:"cat-9", lang:"RU", pages:500, desc:"Moskvadagi shayton va sevgi haqida sehrli roman. Adabiyotning marvaridi." },
  // Jahon adabiyoti
  { id:"book-53", title:"Inson ma'no izlab", author:"Viktor Frankl", cat:"cat-10", lang:"UZ", pages:200, desc:"Kontslagerdan omon qolgan psixologning hayot ma'nosi haqidagi falsafasi. Logoterapiya asoslari." },
  { id:"book-54", title:"Chol va dengiz", author:"Ernest Hemingway", cat:"cat-10", lang:"EN", pages:120, desc:"Qari baliqchi Santyago va ulkan marlin o'rtasidagi kurash. Nobel mukofoti asari." },
  { id:"book-55", title:"Robinzon Kruzo", author:"Daniel Defo", cat:"cat-10", lang:"EN", pages:320, desc:"Kema halokatidan omon qolgan odamning orolda yolg'iz hayot kechirishi. Sarguzasht klassikasi." },
  { id:"book-56", title:"Graf Monte-Kristo", author:"Alexandre Dumas", cat:"cat-10", lang:"EN", pages:900, desc:"Xiyonat qurboni Edmond Dantesning qasos va kechirim tarixi. Eng qiziqarli sarguzasht romani." },
  { id:"book-57", title:"Uch mushketyor", author:"Alexandre Dumas", cat:"cat-10", lang:"EN", pages:600, desc:"D'Artanyan va uch mushketyorning jasorati. Do'stlik va sadoqat madhiyasi." },
  { id:"book-58", title:"Oliver Tvist", author:"Charles Dickens", cat:"cat-10", lang:"EN", pages:400, desc:"Yetim bolaning Londondagi og'ir hayoti va jinoyat olamidan qutulishi." },
  { id:"book-59", title:"Tom Soyerning sarguzashtlari", author:"Mark Twain", cat:"cat-10", lang:"EN", pages:260, desc:"Sho'x Tom Soyer va Geklberri Finnning Mississippi bo'yidagi sarguzashtlari." },
  { id:"book-60", title:"Geklberri Finnning sarguzashtlari", author:"Mark Twain", cat:"cat-10", lang:"EN", pages:300, desc:"Tom Soyerning do'sti Gekning qochqin qul Jim bilan daryo bo'ylab sayohati." },
  { id:"book-61", title:"Jek London hikoyalari", author:"Jack London", cat:"cat-10", lang:"EN", pages:250, desc:"Shimolning ayozi, oltin izlovchilar va itlar hayoti haqida kuchli hikoyalar." },
  { id:"book-62", title:"1984", author:"George Orwell", cat:"cat-10", lang:"EN", pages:328, desc:"Totalitar tuzum, Katta Aka va haqiqat vazirligi. Erkinlik va haqiqat uchun kurash. XX asrning eng ogohlantiruvchi romani." },
  // Shaxsiy rivojlanish
  { id:"book-63", title:"Emotsional intellekt", author:"Daniel Goleman", cat:"cat-7", lang:"UZ", pages:350, desc:"IQ dan muhimroq EQ. His-tuyg'ularni boshqarish va muvaffaqiyat sirlari." },
  { id:"book-64", title:"Muvaffaqiyatning 7 ko'nikmasi", author:"Stephen Covey", cat:"cat-7", lang:"UZ", pages:380, desc:"Samarali odamlarning 7 odati. Shaxsiy va professional o'sish uchun yo'l xaritasi." },
  { id:"book-65", title:"Boy ota, kambag'al ota", author:"Robert Kiyosaki", cat:"cat-7", lang:"UZ", pages:260, desc:"Moliyaviy savodxonlik darslari. Pulni o'zing uchun ishlatish ilmi." },
  { id:"book-66", title:"Yo'q deyishni o'rganish", author:"Dale Carnegie", cat:"cat-7", lang:"UZ", pages:200, desc:"Chegaralarni belgilash va o'zini hurmat qilish san'ati. Muloqotda qat'iylik." },
  { id:"book-67", title:"Vaqtni boshqarish", author:"Brian Tracy", cat:"cat-7", lang:"UZ", pages:220, desc:"Vaqt - eng qimmat resurs. Har bir daqiqadan unumli foydalanish usullari." },
  { id:"book-68", title:"O'ziga ishonch va liderlik", author:"Robin Sharma", cat:"cat-7", lang:"UZ", pages:280, desc:"Ichki kuchni kashf etish va yetakchilik fazilatlarini rivojlantirish." },
  { id:"book-69", title:"Psixologiya asoslari", author:"Zigmund Freyd", cat:"cat-7", lang:"UZ", pages:320, desc:"Yoshlar uchun psixologiya. Ong, ongsizlik va xulq-atvor sirlari sodda tilda." },
  { id:"book-70", title:"Odob-axloq to'plami", author:"Abdullah Avloniy", cat:"cat-7", lang:"UZ", pages:180, desc:"Yoshlar uchun tarbiyaviy pandnoma. Odob, axloq va insoniy munosabatlar haqida." },
];

async function main(){
  console.log("📚 Yangi kitoblar qo'shilmoqda...");
  // Categories
  for(const c of CATEGORIES){
    await prisma.category.upsert({ where:{ id:c.id }, update:{ name:c.name, slug:c.slug, description:c.description, icon:c.icon }, create:{ id:c.id, name:c.name, slug:c.slug, description:c.description, icon:c.icon } });
    console.log(`  📂 ${c.name}`);
  }
  // Authors + Books
  const publicCovers = path.join(process.cwd(),"public/covers");
  const pdfDir = path.join(process.cwd(),"storage/private/pdfs");
  fs.mkdirSync(publicCovers,{recursive:true});
  fs.mkdirSync(pdfDir,{recursive:true});

  // Keep map authorName -> id
  const authorMap = new Map();
  // preload existing authors
  const existingAuthors = await prisma.author.findMany({select:{id:true,name:true}});
  for(const a of existingAuthors) authorMap.set(a.name, a.id);

  for(const b of BOOKS){
    let authorId = authorMap.get(b.author);
    if(!authorId){
      const slug = "author-" + slugify(b.author);
      const existing = await prisma.author.findFirst({ where:{ name:b.author }});
      if(existing) authorId = existing.id;
      else {
        const created = await prisma.author.create({ data:{ id: slug, name:b.author, biography: b.author + " — mashhur yozuvchi." }});
        authorId = created.id;
      }
      authorMap.set(b.author, authorId);
    }
    // Cover
    const coverFile = `${slugify(b.title)}.svg`;
    const coverPath = path.join(publicCovers, coverFile);
    if(!fs.existsSync(coverPath)){
      fs.writeFileSync(coverPath, coverSvg(b.title, colorFor(b.title)));
    }
    const coverUrl = `/covers/${coverFile}`;
    // PDF
    const pdfFile = `${b.id}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFile);
    if(!fs.existsSync(pdfPath)){
      const w = new PDFWriter();
      w.text(b.title, {size:24, bold:true}); w.text(`Muallif: ${b.author}`, {size:12}); w.text(`Turkum: ${b.cat}`, {size:10}); w.text(b.desc, {size:12}); w.text("MBSI Library nashri. Ushbu PDF o'quv maqsadida yaratilgan. Kitobning to'liq matni uchun asl nashrga murojaat qiling.", {size:10}); for(let i=0;i<3;i++){ w.text(`Namuna matn — ${b.title} kitobidan parcha. O'qish madaniyatini rivojlantirish uchun yaratilgan. Kitob ${b.pages} betdan iborat.`, {size:11}); }
      fs.writeFileSync(pdfPath, w.toBuffer());
    }
    const pdfUrl = `pdfs/${pdfFile}`;
    const slug = slugify(b.title);
    // Ensure unique slug
    let finalSlug = slug; let n=1; while(await prisma.book.findFirst({where:{slug:finalSlug, NOT:{id:b.id}}})){ finalSlug = `${slug}-${n++}`; }
    await prisma.book.upsert({
      where:{ id:b.id },
      update:{ title:b.title, slug:finalSlug, description:b.desc, coverUrl, pdfUrl, language:b.lang, totalPages:b.pages, authorId, categoryId:b.cat, isPublished:true },
      create:{ id:b.id, title:b.title, slug:finalSlug, description:b.desc, coverUrl, pdfUrl, language:b.lang, totalPages:b.pages, authorId, categoryId:b.cat, isPublished:true }
    });
    console.log(`  📖 ${b.title} — ${b.author}`);
  }
  console.log(`\n✅ ${BOOKS.length} ta kitob qo'shildi!`);
}

main().catch(e=>{console.error(e); process.exit(1)}).finally(()=>prisma.$disconnect());
