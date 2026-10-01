#!/usr/bin/env node
// "Ali" kitobi uchun oddiy PDF yaratish
import fs from "node:fs";
import path from "node:path";

const TEXT_CONTENT = `Ali va uning sarguzashtlari

1-bob: Boshlanish

Ali oddiy bir oilada tug'ilgan edi. Uning otasi dehqon, onasi esa uy bekasi edi. Ali juda injiq va bilimga chanqoq bola edi. Maktabda o'qishni juda yaxshi ko'rar, doimo eng yaxshi natijalarni ko'rsatardi.

Alining eng sevimli mashg'uloti kitob o'qish edi. U har kuni maktabdan kelgandan keyin kutubxonaga borib, soatlab kitob o'qir edi. Uning eng sevimli kitoblari ilmiy kitoblar va tarixiy asarlar edi.

2-bob: Sarguzasht boshlanadi

Bir kuni Ali kutubxonada o'tirib, g'alati bir kitob topdi. Kitob qoplamasi juda eski va g'alati ko'rinishda edi. Ali kitobni ochdi va ichida yozilgan matnni o'qishga urindi.

Matn juda qadimiy tilda yozilgan edi. Ali bu tilmni tushunish uchun ko'p harakat qildi. Nihoyat, u bu tilni tushuna boshladi. Bu kitobda qadimiy sirlar va bilimlar yozilgan edi.

3-bob: Yangi kashfiyotlar

Ali yangi bilimlar orttirgan sari, uning hayoti butunlay o'zgardi. U endi maktabda boshqa o'quvchilarga ham yordam bera boshladi. O'qituvchilar Alining bilimiga hayrat qolishardi.

Alining eng katta orzusi o'z mamlakatiga foydali inson bo'lish edi. U har kuni ertalab turib, sport bilan shug'ullanib, keyin darslarini takrorlar edi.

4-bob: Sinovlar

Lekin hayot hamma vaqtda ham oson emas edi. Alining oilasida moliyaviy qiyinchiliklar paydo bo'ldi. Otasi kasal bo'lib qoldi. Ali o'z o'qishini to'xtatib, ishlashi kerak bo'ldi.

Lekin Ali yilsamadi. U tungi maktabga qatnab, kun davomida ishlardi. Uning qat'iyati va mehnatsevarligi mahalladagi hamma hayratga solardi.

5-bob: G'alaba

Yillar o'tdi. Ali o'z orzusiga erishdi. U yirik kompaniyada ishlay boshladi va oilasini yaxshi ta'minlay oldi. Lekin u hech qachon o'z boshidan kechirgan sinovlarini unutmadi.

Ali endi boshqa bolalarga yordam berish uchun maxsus fond yaratdi. Uning fondi orqali yuzlab bolalar ta'lim olish imkoniyatiga ega bo'ldi.

Xulosa

Alining hikoyasi bizga ko'rsatadiki, qat'iyat va mehnat bilan har qanday maqsadga erishish mumkin. Qiyinchiliklardan qo'rqmaslik va har doim oldinga intilish kerak. Ali kabi insonlar bizning jamiyatimizning eng qimmatli boyligidir.`;

class PDFWriter {
  constructor() {
    this.objects = [];
    this.pages = [];
    this.cur = [];
    this.y = 720;
    this.objects.push(null);
  }

  addObject(o) {
    this.objects.push(o);
    return this.objects.length;
  }

  addPage() {
    if (this.cur.length > 0) {
      this.pages.push(this.cur.join("\n"));
    }
    this.cur = [];
    this.y = 720;
    const pageId = this.addObject("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents " + (this.objects.length + 1) + " 0 R >>");
    return pageId;
  }

  writeLine(text, fontSize = 12) {
    if (this.y < 72) {
      this.addPage();
    }
    const escaped = text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    this.cur.push(`BT /F1 ${fontSize} Tf 72 ${this.y} Td (${escaped}) Tj ET`);
    this.y -= fontSize * 1.5;
  }

  writePageContent() {
    if (this.cur.length > 0) {
      const content = `<< /Length ${this.cur.join("\n").length} >>\nstream\n${this.cur.join("\n")}\nendstream`;
      this.addObject(content);
      this.pages.push(this.cur.join("\n"));
    }
  }

  generate() {
    this.writePageContent();

    const header = "%PDF-1.4";
    const offsets = [];
    let pdf = header + "\n";

    // Catalog
    offsets.push(pdf.length);
    pdf += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

    // Pages
    offsets.push(pdf.length);
    pdf += `2 0 obj\n<< /Type /Pages /Kids [${this.pages.map((_, i) => `${i + 3} 0 R`).join(" ")}] /Count ${this.pages.length} >>\nendobj\n`;

    // Font
    offsets.push(pdf.length);
    pdf += "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

    // Page objects and content streams
    for (let i = 0; i < this.pages.length; i++) {
      offsets.push(pdf.length);
      const contentId = 4 + this.pages.length + i;
      pdf += `${4 + i} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n`;
    }

    for (const page of this.pages) {
      offsets.push(pdf.length);
      const content = `<< /Length ${page.length} >>\nstream\n${page}\nendstream`;
      pdf += `${4 + this.pages.length + this.pages.indexOf(page)} 0 obj\n${content}\nendobj\n`;
    }

    // xref
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${this.objects.length + this.pages.length + 4}\n`;
    pdf += "0000000000 65535 f \n";
    for (const offset of offsets) {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${this.objects.length + this.pages.length + 4} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return pdf;
  }
}

const writer = new PDFWriter();
writer.addPage();

const lines = TEXT_CONTENT.split("\n");
for (const line of lines) {
  if (line.startsWith("Ali va uning")) {
    writer.writeLine(line, 18);
  } else if (line.startsWith("1-bob") || line.startsWith("2-bob") || line.startsWith("3-bob") || line.startsWith("4-bob") || line.startsWith("5-bob") || line.startsWith("Xulosa")) {
    writer.writeLine("", 8);
    writer.writeLine(line, 14);
  } else if (line.trim() === "") {
    writer.writeLine("", 8);
  } else {
    writer.writeLine(line, 11);
  }
}

const pdf = writer.generate();
const outDir = path.join(process.cwd(), "storage", "private", "pdfs");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "ali-kitobi.pdf");
fs.writeFileSync(outPath, pdf);
console.log(`PDF created: ${outPath} (${pdf.length} bytes)`);
