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
  { id:"cat-1", name:"Ommabop ilm-fan", slug:"ommabop-ilm-fan", description:"Ilmiy kitoblar oddiy tilda", icon:"🔬" },
  { id:"cat-2", name:"Badiiy adabiyot", slug:"badiiy-adabiyot", description:"Roman, hikoya, poemalar", icon:"📖" },
  { id:"cat-3", name:"O'zbek adabiyoti", slug:"ozbek-adabiyoti", description:"Milliy adabiyot namunalari", icon:"🇺🇿" },
  { id:"cat-4", name:"Fizika", slug:"fizika", description:"Fizika faniga oid kitoblar", icon:"⚛️" },
  { id:"cat-5", name:"Matematika", slug:"matematika", description:"Matematika faniga oid kitoblar", icon:"📐" },
  { id:"cat-6", name:"Ingliz tili", slug:"ingliz-tili", description:"Ingliz tili o'rganish kitoblari", icon:"🇬🇧" },
  { id:"cat-7", name:"Shaxsiy rivojlanish", slug:"shaxsiy-rivojlanish", description:"O'zini rivojlantirish kitoblari", icon:"🚀" },
  { id:"cat-8", name:"Tarix", slug:"tarix", description:"Tarixiy kitoblar", icon:"🏛️" },
  { id:"cat-9", name:"Rus adabiyoti", slug:"rus-adabiyoti", description:"Rus mumtoz adabiyoti durdonalari", icon:"🇷🇺" },
  { id:"cat-10", name:"Jahon adabiyoti", slug:"jahon-adabiyoti", description:"Dunyo adabiyotining eng sara asarlari", icon:"🌍" },
];

const BOOKS = [
  // cat-1 Ommabop ilm-fan
  { title:"Olam tarixi", author:"David Christian", cat:"cat-1", lang:"UZ", pages:420, desc:"Koinot paydo bo'lishidan to hozirgi kungacha bo'lgan katta tarixning qisqa va jozibali bayoni." },
  { title:"Nega avtonavis bilan", author:"Brian Cox", cat:"cat-1", lang:"UZ", pages:256, desc:"Koinot, vaqt va yulduzlar haqidagi eng qiziqarli savollarga oson javoblar." },
  { title:"Davriy jadvalning tarixi", author:"Sam Kean", cat:"cat-1", lang:"UZ", pages:320, desc:"Kimyoviy elementlar kashfiyoti ortidagi insoniy hikoyalar." },
  { title:"Genom", author:"Matt Ridley", cat:"cat-1", lang:"UZ", pages:380, desc:"Inson DNKsining 23 xromosomasi bo'ylab sayohat." },
  { title:"On the Origin of Species", author:"Charles Darwin", cat:"cat-1", lang:"EN", pages:500, desc:"Evolyutsiya nazariyasining asosiy asari — tabiiy tanlanish tushuntirilgan." },
  { title:"A Brief History of Time", author:"Stephen Hawking", cat:"cat-1", lang:"EN", pages:212, desc:"Kattalar va kichiklar uchun koinotning kelib chiqishi va vaqtning oqimi." },
  { title:"Kosmos", author:"Carl Sagan", cat:"cat-1", lang:"UZ", pages:400, desc:"Koinotning ulug'vorligi va insoniyatning unga bo'lgan qarashlari haqida ilmiy safar." },
  { title:"Bilim tortiqlari", author:"Bill Bryson", cat:"cat-1", lang:"UZ", pages:560, desc:"Deyarli hamma narsa haqida qisqacha tarix — ilm-fan asoslari sodda tilda." },
  // cat-2 Badiiy adabiyot
  { title:"Qayg'usi qalblar", author:"Omar Xayyom", cat:"cat-2", lang:"UZ", pages:160, desc:"Ruboiylar to'plami — hayot, sevgi va donishmandlik haqida." },
  { title:"Ishqda shayton", author:"François Lelord", cat:"cat-2", lang:"UZ", pages:240, desc:"Zamonaviy insonning ruhiy izlanishlari haqida lirik roman." },
  { title:"Kutbdevor", author:"Paulo Coelho", cat:"cat-2", lang:"UZ", pages:208, desc:"Sayyohning ruhiy sarguzashtlari va orzularning g'alabasi." },
  { title:"Sariq kitob", author:"Gustave Flaubert", cat:"cat-2", lang:"UZ", pages:180, desc:"Ijodkorning ichki olami va ijod azobi haqida ertaklar to'plami." },
  { title:"Qor uyi", author:"Haruki Murakami", cat:"cat-2", lang:"UZ", pages:300, desc:"Kunst va sirli voqealarga yo'g'rilgan zamonaviy yapon prozasi." },
  { title:"The Great Gatsby", author:"F. Scott Fitzgerald", cat:"cat-2", lang:"EN", pages:180, desc:"Amerika orzusining eng yorqin va fojiali timsoli." },
  { title:"To Kill a Mockingbird", author:"Harper Lee", cat:"cat-2", lang:"EN", pages:281, desc:"Bolalik, adolat va irqiy tenglik haqidagi klassik roman." },
  { title:"The Catcher in the Rye", author:"J.D. Salinger", cat:"cat-2", lang:"EN", pages:277, desc:"O'smir qalbining iztirobi va jamiyatga norozilik romani." },
  // cat-3 O'zbek adabiyoti
  { title:"O'tkan kunlar", author:"Abdulla Qodiriy", cat:"cat-3", lang:"UZ", pages:400, desc:"O'zbek romanchiligining ilk yodgorligi — sevgi va sof vatanparvarlik hikoyasi." },
  { title:"Mehrobdan chayon", author:"Abdulla Qodiriy", cat:"cat-3", lang:"UZ", pages:320, desc:"O'rta Osiyo xonliklari davridagi siyosiy va ijtimoiy hayot tasviri." },
  { title:"Ikki eshik orasi", author:"O'tkir Hoshimov", cat:"cat-3", lang:"UZ", pages:280, desc:"Urush yillaridagi o'zbek oilasining taqdiri va sabr-toqat haqida ta'sirchan roman." },
  { title:"Yulduzli tunlar", author:"Pirimqul Qodirov", cat:"cat-3", lang:"UZ", pages:260, desc:"Bobur Mirzo hayoti haqida badiiy-tarixiy roman." },
  { title:"Boburnoma", author:"Zahiriddin Muhammad Bobur", cat:"cat-3", lang:"UZ", pages:400, desc:"Buyuk sarkarda va shoir Boburning o'zi yozgan memuar." },
  { title:"Navoiy", author:"Oybek", cat:"cat-3", lang:"UZ", pages:310, desc:"Alisher Navoiy siymosi va ijodi haqida roman." },
  { title:"Ulug'bek xazinasi", author:"Odil Yoqubov", cat:"cat-3", lang:"UZ", pages:340, desc:"Mirzo Ulug'bek va uning ilmiy merosi haqida tarixiy roman." },
  { title:"Shum bola", author:"G'afur G'ulom", cat:"cat-3", lang:"UZ", pages:180, desc:"Qoravoy ismli bolaning sho'x va kulgili sarguzashtlari." },
  { title:"Sariq devni minib", author:"Xudoyberdi To'xtaboyev", cat:"cat-3", lang:"UZ", pages:200, desc:"Bolalar uchun fantastik-sarguzasht asar." },
  { title:"Kichkina shahzoda", author:"Antoine de Saint-Exupéry", cat:"cat-3", lang:"UZ", pages:96, desc:"Do'stlik, muhabbat va insoniylik haqida falsafiy ertak." },
  // cat-4 Fizika
  { title:"Fizika asosiy kurs", author:"P. M. Mardonov", cat:"cat-4", lang:"UZ", pages:480, desc:"Umumiy o'rta ta'lim uchun fizika darsligi — mexanika, issiqlik, elektr." },
  { title:"Quyosh tizimi", author:"V.A. Bronshten", cat:"cat-4", lang:"UZ", pages:280, desc:"Sayyoralar, kometalar va asteroidlar haqida ommabop astronomiya." },
  { title:"Optika asoslari", author:"G. S. Landsberg", cat:"cat-4", lang:"UZ", pages:360, desc:"Yorug'lik, linzalar va optik asboblar fizikasi." },
  { title:"Elektr va magnetizm", author:"I. V. Savelyev", cat:"cat-4", lang:"UZ", pages:520, desc:"Elektromagnetizm nazariyasi va amaliy masalalar." },
  { title:"Thermodynamics", author:"Enrico Fermi", cat:"cat-4", lang:"EN", pages:160, desc:"Issiqlik jarayonlari va energiya saqlanish qonunlari." },
  { title:"The Elegant Universe", author:"Brian Greene", cat:"cat-4", lang:"EN", pages:448, desc:"Superstrunalar nazariyasi orqali koinot sirlari." },
  // cat-5 Matematika
  { title:"Matematika — 5-sinf", author:"M. Mirzahmedov", cat:"cat-5", lang:"UZ", pages:320, desc:"Natural sonlar, kasrlar va geometrik figura boshlandiqlari." },
  { title:"Algebra — 7-sinf", author:"Sh. A. Alimov", cat:"cat-5", lang:"UZ", pages:288, desc:"Ko'phadlar, tenglamalar va funksiyalar asoslari." },
  { title:"Geometriya — 7-9-sinf", author:"L. S. Atanasyan", cat:"cat-5", lang:"UZ", pages:384, desc:"Uchburchaklar, to'rtburchaklar va doira geometriyasi." },
  { title:"Matematikani chuqur o'rganamiz", author:"E. J. Zubareva", cat:"cat-5", lang:"UZ", pages:260, desc:"Maktab matematikasidan tashqari qiziqarli masalalar." },
  { title:"The Joy of Science", author:"Jim Al-Khalili", cat:"cat-5", lang:"EN", pages:272, desc:"Matematika va fizika dunyosining go'zalligi — 30 ta kitobcha." },
  { title:"Number Theory", author:"G.H. Hardy", cat:"cat-5", lang:"EN", pages:308, desc:"Sonlar nazariyasining klassik kursi." },
  // cat-6 Ingliz tili
  { title:"English Grammar in Use", author:"Raymond Murphy", cat:"cat-6", lang:"EN", pages:380, desc:"Zamonaviy ingliz tili grammatikasi — mashqlar bilan." },
  { title:"Essential Words", author:"Barron's", cat:"cat-6", lang:"EN", pages:350, desc:"IELTS va SAT uchun 3000 ta asosiy so'z." },
  { title:"English for Beginners", author:"Uzbek-language Course", cat:"cat-6", lang:"EN", pages:200, desc:"Ingliz tilini noldan o'rganuvchilar uchun qo'llanma." },
  { title:"Business English", author:"Mike McCarthy", cat:"cat-6", lang:"EN", pages:280, desc:"Ish va biznes muloqoti uchun ingliz tili." },
  { title:"Speaking Fluency", author:"Mark Hancock", cat:"cat-6", lang:"EN", pages:240, desc:"Erkin va ishonchli gapirish uchun amaliy mashqlar." },
  { title:"Reading Explorer 1", author:"Nancy Douglas", cat:"cat-6", lang:"EN", pages:176, desc:"Turli mavzulardagi matnlar orqali ingliz tilida o'qish." },
  // cat-7 Shaxsiy rivojlanish
  { title:"Atomic Habits", author:"James Clear", cat:"cat-7", lang:"UZ", pages:320, desc:"Kichik o'zgarishlar bilan katta natijalarga erishish tizimi." },
  { title:"The 7 Habits of Highly Effective People", author:"Stephen Covey", cat:"cat-7", lang:"EN", pages:391, desc:"Samarali odamlarning 7 ta odati — shaxsiy o'sish yo'l xaritasi." },
  { title:"Emotsional intellekt", author:"Daniel Goleman", cat:"cat-7", lang:"UZ", pages:350, desc:"EQ dunyoda muvaffaqiyatning asosiy kaliti ekanligi." },
  { title:"Deep Work", author:"Cal Newport", cat:"cat-7", lang:"EN", pages:304, desc:"Chalg'itishlarga qarshi chuqur ishlash qobiliyatini rivojlantirish." },
  { title:"How to Win Friends", author:"Dale Carnegie", cat:"cat-7", lang:"EN", pages:288, desc:"Insonlar bilan muomala san'ati — klassik qo'llanma." },
  { title:"Vaqtni boshqarish", author:"Brian Tracy", cat:"cat-7", lang:"UZ", pages:220, desc:"Energiya, e'tibor va vaqtdan maksimal foyda olish usullari." },
  { title:"Boy ota, kambag'al ota", author:"Robert Kiyosaki", cat:"cat-7", lang:"UZ", pages:260, desc:"Moliyaviy savodxonlik — pullarni o'zingiz uchun ishlatish." },
  { title:"Mindset", author:"Carol Dweck", cat:"cat-7", lang:"EN", pages:320, desc:"O'sish tafakkuri va qat'iy tafakkur farqi." },
  // cat-8 Tarix
  { title:"Temuriylar tarixi", author:"H. H. Zirologov / O'zbekiston tarixi", cat:"cat-8", lang:"UZ", pages:360, desc:"Amir Temur davlati va temuriy shahzodalar davri tarixi." },
  { title:"Jaloliddin Manguberdi", author:"N. G'ulomov", cat:"cat-8", lang:"UZ", pages:300, desc:"Mo'g'ul bosqiniga qarshi kurashgan jasur sarkarda." },
  { title:"Sultonsan va qahramonlar", author:"P. Qodirov", cat:"cat-8", lang:"UZ", pages:340, desc:"O'zbek xalqining qahramonlik tarixi." },
  { title:"Buyuk ipak yo'li", author:"P. N. Qodirov", cat:"cat-8", lang:"UZ", pages:280, desc:"Ipak yo'lining O'rta Osiyo tarixidagi o'rni." },
  { title:"A History of the World", author:"Andrew Marr", cat:"cat-8", lang:"EN", pages:608, desc:"Insoniyatning butun tarixini qamrab olgan panoramik asar." },
  { title:"Sapiens", author:"Yuval Noah Harari", cat:"cat-8", lang:"EN", pages:443, desc:"Insoniyatning qisqa tarixi — qadimdan hozirgacha." },
  { title:"Guns, Germs, and Steel", author:"Jared Diamond", cat:"cat-8", lang:"EN", pages:480, desc:"Sivilizatsiyalar taqdiri nima uchun turlicha bo'lgan." },
  { title:"Xorazm tarixi", author:"Un-verified XorazmSH tarixchi", cat:"cat-8", lang:"UZ", pages:320, desc:"Amudaryo bo'yidagi qadimiy madaniyatlar tarixi." },
  // cat-9 Rus adabiyoti
  { title:"Jinoyat va jazo", author:"Fyodor Dostoyevskiy", cat:"cat-9", lang:"RU", pages:600, desc:"Raskolnikovning jinoyati va vijdon azobi — rus psixologik romanining cho'qqisi." },
  { title:"Urush va tinchlik", author:"Lev Tolstoy", cat:"cat-9", lang:"RU", pages:1200, desc:"1812-yil urushi fonida rus jamiyatining epik panoramasi." },
  { title:"Anna Karenina", author:"Lev Tolstoy", cat:"cat-9", lang:"RU", pages:800, desc:"Sevgi, oila va jamiyat bosimi o'rtasidagi fojia." },
  { title:"Oq tunlar", author:"Fyodor Dostoyevskiy", cat:"cat-9", lang:"RU", pages:120, desc:"Peterburgdagi oq tunlarda orzuchan sevgi qissasi." },
  { title:"Ota va bolalar", author:"Ivan Turgenev", cat:"cat-9", lang:"RU", pages:280, desc:"Avlodlar o'rtasidagi ziddiyat va nihilist yigitning fojiasi." },
  { title:"Usta va Margarita", author:"Mixail Bulgakov", cat:"cat-9", lang:"RU", pages:500, desc:"Moskvada shayton va ulug' sevgi haqidagi sehrli roman." },
  { title:"O'lik jonlar", author:"Nikolay Gogol", cat:"cat-9", lang:"RU", pages:350, desc:"Chichikov va o'lik jonlar — krepostnoylik jamiyati satirasi." },
  { title:"Chexov hikoyalari", author:"Anton Chexov", cat:"cat-9", lang:"RU", pages:300, desc:"Inson qalbi va kundalik hayotdagi kulgili-fojiali hikoyalar." },
  { title:"It yurak", author:"Mixail Bulgakov", cat:"cat-9", lang:"RU", pages:150, desc:"Ilm-fan va axloq chegarasi haqida satirik qissa." },
  { title:"Yevgeniy Onegin", author:"Aleksandr Pushkin", cat:"cat-9", lang:"RU", pages:240, desc:"She'riy romonda Onegin va Tatyana muhabbati." },
  { title:"Kapitan qizi", author:"Aleksandr Pushkin", cat:"cat-9", lang:"RU", pages:180, desc:"Pugachev qo'zg'oloni davridagi sevgi va sadoqat." },
  // cat-10 Jahon adabiyoti
  { title:"1984", author:"George Orwell", cat:"cat-10", lang:"EN", pages:328, desc:"Totalitar tuzum, Katta Aka va haqiqat uchun kurash." },
  { title:"Graf Monte-Kristo", author:"Alexandre Dumas", cat:"cat-10", lang:"EN", pages:900, desc:"Xiyonat qurboni Edmond Dantesning qasos tarixi." },
  { title:"Uch mushketyor", author:"Alexandre Dumas", cat:"cat-10", lang:"EN", pages:600, desc:"D'Artanyan va uch mushketyorning jasorati." },
  { title:"Robinzon Kruzo", author:"Daniel Defo", cat:"cat-10", lang:"EN", pages:320, desc:"Orolda yolg'iz qolgan odamning omon qolish hikoyasi." },
  { title:"Chol va dengiz", author:"Ernest Hemingway", cat:"cat-10", lang:"EN", pages:120, desc:"Qari baliqchi va ulkan marlin o'rtasidagi kurash." },
  { title:"Oliver Tvist", author:"Charles Dickens", cat:"cat-10", lang:"EN", pages:400, desc:"Yetim bolaning Londondagi og'ir hayoti." },
  { title:"Tom Soyer sarguzashtlari", author:"Mark Twain", cat:"cat-10", lang:"EN", pages:260, desc:"Mississippi bo'yidagi sho'x bolalik sarguzashtlari." },
  { title:"Geklberri Finn sarguzashtlari", author:"Mark Twain", cat:"cat-10", lang:"EN", pages:300, desc:"Gek va Jimning daryo bo'ylab sayohati." },
  { title:"Jek London hikoyalari", author:"Jack London", cat:"cat-10", lang:"EN", pages:250, desc:"Shimol tabiati va inson irodasi haqida kuchli hikoyalar." },
  { title:"Inson ma'no izlab", author:"Viktor Frankl", cat:"cat-10", lang:"EN", pages:200, desc:"Kontslagerda omon qolgan psixologning hayot ma'nosi falsafasi." },
  { title:"The Alchemist", author:"Paulo Coelho", cat:"cat-10", lang:"EN", pages:208, desc:"Orzular sharqiy ertak shaklida — izlanish va maqsad haqida." },
  { title:"The Little Prince", author:"Antoine de Saint-Exupéry", cat:"cat-10", lang:"EN", pages:93, desc:"Sevgi, do'stlik va hayot mazmuni haqidagi mashhur ertak." },
  { title:"The Old Man and the Sea", author:"Ernest Hemingway", cat:"cat-10", lang:"EN", pages:127, desc:"Bir kecha-kunduzlik jangda sinovdan o'tgan inson irodasi." },
  { title:"Pride and Prejudice", author:"Jane Austen", cat:"cat-10", lang:"EN", pages:432, desc:"Tarbiya, sevgi va ijtimoiy sinf masalalari komediyasi." },
  { title:"Wuthering Heights", author:"Emily Brontë", cat:"cat-10", lang:"EN", pages:416, desc:"Olovli sevgi va qasos haqidagi g'oyat mushkul roman." },
  { title:"War of the Worlds", author:"H.G. Wells", cat:"cat-10", lang:"EN", pages:192, desc:"Marsliklarning Yerga bostirib kelishi — ilmiy fantastika klassikasi." },
  { title:"Brave New World", author:"Aldous Huxley", cat:"cat-10", lang:"EN", pages:268, desc:"Kelajakdagi texnokratik va zo'rlik jamiyati haqida distopiya." },
  { title:"The Old Man", author:"Aytmatov / Adabiyot", cat:"cat-10", lang:"UZ", pages:160, desc:"Xalq hikmatining zamonaviy badiiy talqini." },
  { title:"Oq kema", author:"Chingiz Aytmatov", cat:"cat-10", lang:"UZ", pages:220, desc:"Bolalik orzulari va haqiqat qarama-qarshiligi haqida hikoya." },
  { title:"Sobiq dunyoda", author:"Kurt Vonnegut", cat:"cat-10", lang:"EN", pages:192, desc:"Kosmik va satirik fantastika klassikasi." },
  { title:"Ferma hayvonlari", author:"George Orwell", cat:"cat-10", lang:"EN", pages:112, desc:"Hokimiyat va diktatura allegoriyasi." },
  { title:"Gulliver sayohatlari", author:"Jonathan Swift", cat:"cat-10", lang:"EN", pages:290, desc:"Satirik sayohat — jamiyat kamchiliklarini fosh etuvchi asar." },
  { title:"Badiiy mozaika", author:"Gustav Flaubert", cat:"cat-10", lang:"UZ", pages:380, desc:"Madam Bovari muallifi — inson va jamiyat haqidagi roman." },
  { title:"Seshan Qissalar", author:"Nolitta Samoylov", cat:"cat-10", lang:"UZ", pages:175, desc:"Zamonaviy o'zbek qissalari to'plami." },
  { title:"The Stranger", author:"Albert Camus", cat:"cat-10", lang:"EN", pages:123, desc:"Absurd falsafaning eng mashhur badiiy timsoli." },
  { title:"Don Quixote", author:"Miguel de Cervantes", cat:"cat-10", lang:"EN", pages:863, desc:"Idealist ritsar va uning sodiq xizmatkori hikoyasi." },
  { title:"The Metamorphosis", author:"Franz Kafka", cat:"cat-10", lang:"EN", pages:201, desc:"Bir kunda hasharotga aylangan odamning fojiasi." },
  { title:"The Da Vinci Code", author:"Dan Brown", cat:"cat-10", lang:"EN", pages:489, desc:"Sirlar va mistika bilan to'la zamonaviy detektiv." },
  { title:"Yurak qo'nog'i", author:"Tohir Malik", cat:"cat-3", lang:"UZ", pages:240, desc:"Zamonaviy o'zbek detektiv adabiyotining namunasi — mehnat va taqdir haqida." },
];

async function main(){
  console.log("📚 100 demo kitob qo'shilmoqda...");

  // Categories (upsert — existing ids reused)
  for(const c of CATEGORIES){
    await prisma.category.upsert({
      where:{ id:c.id },
      update:{ name:c.name, slug:c.slug, description:c.description, icon:c.icon },
      create:{ id:c.id, name:c.name, slug:c.slug, description:c.description, icon:c.icon },
    });
  }
  console.log(`  📂 ${CATEGORIES.length} kategoriya tayyor`);

  const publicCovers = path.join(process.cwd(),"public/covers");
  const pdfDir = path.join(process.cwd(),"storage/private/pdfs");
  fs.mkdirSync(publicCovers,{recursive:true});
  fs.mkdirSync(pdfDir,{recursive:true});

  // Preload existing authors (name -> id)
  const existing = await prisma.author.findMany({ select:{id:true, name:true} });
  const authorIdByName = new Map(existing.map(a=>[a.name.toLowerCase().trim(), a.id]));

  let created = 0, updated = 0, authorCreated = 0;
  for(const b of BOOKS){
    // Author
    let authorId = authorIdByName.get(b.author.toLowerCase().trim());
    if(!authorId){
      const found = await prisma.author.findFirst({ where:{ name:b.author }});
      if(found){ authorId = found.id; authorIdByName.set(b.author.toLowerCase().trim(), authorId); }
      else {
        const createdAuthor = await prisma.author.create({ data:{ name:b.author, biography:`${b.author} — mashhur yozuvchi.` } });
        authorId = createdAuthor.id;
        authorIdByName.set(b.author.toLowerCase().trim(), authorId);
        authorCreated++;
      }
    }

    // Cover SVG
    const coverFile = `${slugify(b.title)}.svg`;
    const coverPath = path.join(publicCovers, coverFile);
    if(!fs.existsSync(coverPath)){
      fs.writeFileSync(coverPath, coverSvg(b.title, colorFor(b.title)));
    }
    const coverUrl = `/covers/${coverFile}`;

    // Placeholder PDF
    const pdfFile = `${slugify(b.title)}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFile);
    let fileSize = 0;
    if(!fs.existsSync(pdfPath)){
      const w = new PDFWriter();
      w.text(b.title, {size:24, bold:true});
      w.text(`Muallif: ${b.author}`, {size:12});
      w.text(`Turkum: ${b.cat}`, {size:10});
      w.text("", {size:12});
      w.text("MBSI Library demo nashri.", {size:12});
      w.text("Ushbu PDF o'quv maqsadida yaratilgan. Kitobning to'liq matni uchun asl nashrga murojaat qiling.", {size:10});
      w.text("", {size:12});
      for(let i=0;i<Math.max(3, Math.min(30, Math.round(b.pages/10))); i++){
        w.text(`Namuna matn — ${b.title} kitobidan parcha. O'qish madaniyatini rivojlantirish uchun yaratilgan demo kitob.`, {size:11});
      }
      fs.writeFileSync(pdfPath, w.toBuffer());
    }
    const fileStat = fs.statSync(pdfPath);
    fileSize = fileStat.size;
    const pdfUrl = `pdfs/${pdfFile}`;

    // Slug unique
    let slug = slugify(b.title);
    const existingSlug = await prisma.book.findUnique({ where:{ slug }});
    if(existingSlug) slug = `${slug}-${Date.now()}`;

    // Upsert book
    const bookData = {
      title: b.title,
      slug,
      description: b.desc,
      coverUrl,
      pdfUrl,
      language: b.lang,
      totalPages: b.pages,
      fileSize,
      authorId,
      categoryId: b.cat,
      isPublished: true,
      status: "ACTIVE",
    };
    const found = await prisma.book.findFirst({ where:{ title:{ equals:b.title }} });
    if(found){
      await prisma.book.update({ where:{ id:found.id }, data:bookData });
      updated++;
    } else {
      await prisma.book.create({ data:bookData });
      created++;
    }
  }

  console.log(`  📖 Yangi: ${created} | Yangilangan: ${updated} | Muallif yaratilgan: ${authorCreated}`);
  const total = await prisma.book.count();
  console.log(`\n✅ Jami kitoblar: ${total}`);
}

main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());