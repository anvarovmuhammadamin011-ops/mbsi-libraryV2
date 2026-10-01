#!/usr/bin/env node
// ============================================================
// MBSI Library — PDF Book Generator
// Generates real, multi-page PDF files for the demo library.
// No external dependencies — uses raw PDF 1.4 format.
// ============================================================

import fs from "node:fs";
import path from "node:path";

const PRIVATE_ROOT = path.join(import.meta.dirname, "..", "storage", "private", "pdfs");
fs.mkdirSync(PRIVATE_ROOT, { recursive: true });

// ─── Minimal PDF Generator ──────────────────────────────────

class PDFWriter {
  constructor() {
    this.objects = [];
    this.pages = [];
    this.currentPageContents = [];
    this.currentFont = "F1";
    this.fontSize = 12;
    this.y = 720; // start near top
    this.objects.push(null); // placeholder for object 0
  }

  // Add a PDF object and return its 1-based number
  addObject(obj) {
    this.objects.push(obj);
    return this.objects.length; // 1-based
  }

  // Start a new page
  newPage() {
    if (this.currentPageContents.length > 0) {
      this._endPage();
    }
    this.currentPageContents = [];
    this.y = 720;
  }

  // Add text to the current page
  text(str, opts = {}) {
    const size = opts.size || this.fontSize;
    const bold = opts.bold || false;
    const indent = opts.indent || 0;
    const maxWidth = opts.maxWidth || 480; // ~6.6 inches
    const lineHeight = size * 1.4;

    const font = bold ? "F2" : "F1";
    const lines = this._wrapText(str, size, maxWidth - indent, font);

    for (const line of lines) {
      if (this.y < 72) {
        this._endPage();
        this.currentPageContents = [];
        this.y = 720;
      }
      const escaped = this._escapePDF(line);
      const x = 72 + indent;
      this.currentPageContents.push(
        `BT ${font} ${size} Tf ${x} ${this.y} Td (${escaped}) Tj ET`
      );
      this.y -= lineHeight;
    }
  }

  // Add a title (larger font, centered)
  title(str) {
    this.text(str, { size: 24, bold: true });
    this.y -= 10;
  }

  // Add a chapter heading
  chapter(str) {
    if (this.y < 120) {
      this.newPage();
    }
    this.y -= 20;
    this.text(str, { size: 18, bold: true });
    this.y -= 5;
    // Draw a line
    this.currentPageContents.push(
      `0.5 0.5 0.5 RG 72 ${this.y} m 540 ${this.y} l 1.5 w S`
    );
    this.y -= 15;
  }

  // Add a subtitle
  subtitle(str) {
    this.text(str, { size: 14, bold: true });
    this.y -= 5;
  }

  // Add a paragraph with indentation
  paragraph(str) {
    this.text(str, { indent: 20 });
    this.y -= 8;
  }

  // Add blank space
  space(lines = 1) {
    this.y -= lines * 16;
  }

  // Add a separator
  separator() {
    this.y -= 10;
    this.currentPageContents.push(
      `0.8 0.8 0.8 RG 200 ${this.y} m 412 ${this.y} l 0.5 w S`
    );
    this.y -= 15;
  }

  // Finish the current page
  _endPage() {
    const content = this.currentPageContents.join("\n");
    const contentId = this.addObject({
      type: "stream",
      data: content,
    });
    this.pages.push(contentId);
  }

  // Generate the final PDF buffer
  toBuffer() {
    if (this.currentPageContents.length > 0) {
      this._endPage();
    }

    const offsets = [];
    let pdf = "%PDF-1.4\n";

    for (let i = 1; i < this.objects.length; i++) {
      offsets.push(pdf.length);
      const obj = this.objects[i];
      if (obj.type === "stream") {
        pdf += `${i} 0 obj\n<< /Length ${obj.data.length} >>\nstream\n${obj.data}\nendstream\nendobj\n\n`;
      } else {
        pdf += `${i} 0 obj\n${obj.data}\nendobj\n\n`;
      }
    }

    // Font objects (add at end)
    const font1Id = this.objects.length;
    offsets.push(pdf.length);
    pdf += `${font1Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n\n`;

    const font2Id = font1Id + 1;
    offsets.push(pdf.length);
    pdf += `${font2Id} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n\n`;

    // Pages object
    const pagesId = font2Id + 1;
    offsets.push(pdf.length);
    const kids = this.pages.map((id) => `${id} 0 R`).join(" ");
    pdf += `${pagesId} 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${this.pages.length} >>\nendobj\n\n`;

    // Page objects
    const pageObjIds = [];
    for (const contentId of this.pages) {
      const pageId = this.objects.length + 1 + pageObjIds.length;
      pageObjIds.push(pageId);
      offsets.push(pdf.length);
      pdf += `${pageId} 0 obj\n<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R >> >> >>\nendobj\n\n`;
    }

    // Catalog
    const catalogId = this.objects.length + 1 + pageObjIds.length;
    offsets.push(pdf.length);
    pdf += `${catalogId} 0 obj\n<< /Type /Catalog /Pages ${pagesId} 0 R >>\nendobj\n\n`;

    // xref
    const xrefOffset = pdf.length;
    const total = catalogId + 1;
    pdf += `xref\n0 ${total}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 0; i < offsets.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${total} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(pdf, "latin1");
  }

  _wrapText(str, fontSize, maxWidth, _font) {
    // Approximate: ~0.5 points per character at 12pt
    const charWidth = fontSize * 0.5;
    const maxChars = Math.floor(maxWidth / charWidth);
    const words = str.split(" ");
    const lines = [];
    let line = "";

    for (const word of words) {
      if ((line + " " + word).trim().length > maxChars && line) {
        lines.push(line.trim());
        line = word;
      } else {
        line = line ? line + " " + word : word;
      }
    }
    if (line) lines.push(line.trim());
    return lines.length > 0 ? lines : [""];
  }

  _escapePDF(str) {
    return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }
}

// ─── Book Content Data ──────────────────────────────────────

const BOOKS = [
  {
    id: "book-1",
    file: "book-1.pdf",
    title: "Atomic Habits",
    subtitle: "James Clear",
    chapters: [
      {
        title: "The Fundamentals: Why Tiny Changes Make a Big Difference",
        paragraphs: [
          "Habits are the compound interest of self-improvement. The same way that money multiplies through compound interest, the effects of your habits multiply as you repeat them. They seem to make little difference on any given day and yet the impact they deliver over the months and years can be enormous.",
          "It is only when looking back two, five, or perhaps ten years later that the value of good habits and the cost of bad ones becomes strikingly apparent. This can be a difficult concept to appreciate in daily life. We often dismiss small changes because they don't seem to matter very much in the moment.",
          "If you save a little money now, you're still not a millionaire. If you go to the gym three days in a row, you're still out of shape. If you study Mandarin for an hour tonight, you still haven't learned the language. We make a few changes, but the results never seem to come quickly and so we slide back into our previous routines.",
        ],
      },
      {
        title: "The 1% Rule: Getting 1 Percent Better Every Day",
        paragraphs: [
          "Imagine you have a cube of ice in your hands. You're sitting in a room that is -25 degrees Celsius. The ice is solid. Now you raise the temperature of the room by just one degree to -24 degrees. Nothing happens. You raise it another degree to -23 degrees. Still nothing happens.",
          "The ice hasn't changed at all. It's the same cube. You keep raising the temperature, degree by degree, waiting for something to happen. Finally, you raise the temperature to 0 degrees and the ice begins to melt. The change only happened after you crossed that critical threshold.",
          "Breakthrough moments are often the result of many previous actions, which build up the potential required to unleash a major change. This is the meaning of the idiom 'the straw that broke the camel's back.' Similarly, your habits are like compound interest for self-improvement.",
        ],
      },
      {
        title: "The Four Laws of Behavior Change",
        paragraphs: [
          "The first law is Cue. Make it obvious. A cue is the bit of information that tells your brain to start a behavior. It's like a signal that says, hey, this is where you are now. Pay attention.",
          "The second law is Craving. Make it attractive. Cravings are the second component of every habit. Without some level of motivation or desire — without wanting a change — we have no reason to act. What you really want is not the habit itself but the change in state it delivers.",
          "The third law is Response. Make it easy. The more energy an action requires, the less likely you are to do it. If you're trying to exercise, running one mile is easier than running five. If you're trying to read, reading one page is easier than reading twenty.",
          "The fourth law is Reward. Make it satisfying. The reward is the end goal of every habit. The cue is about noticing the reward. The craving is about wanting the reward. The response is about getting the reward.",
        ],
      },
      {
        title: "Identity-Based Habits",
        paragraphs: [
          "True behavior change is identity change. You might start a habit because of motivation, but the only reason you'll stick with one is that it becomes part of your identity. Anyone can convince themselves to go to the gym once or eat one healthy meal, but it's hard to form a new identity.",
          "The goal isn't to read a book, the goal is to become a reader. The goal isn't to run a marathon, the goal is to become a runner. The goal isn't to learn an instrument, the goal is to become a musician. Every action you take is a vote for the type of person you wish to become.",
          "Your identity is not fixed. Like everything else, it is an ongoing process that you evolve over time. Each habit you have塑造s your sense of self. The more you repeat a behavior, the more you reinforce the identity that comes with it.",
        ],
      },
      {
        title: "Systems and Goals",
        paragraphs: [
          "Goals are good for setting a direction, but systems are best for making progress. Winners and losers have the same goals. Every Olympic athlete wants to win a gold medal. Every student who takes a test wants to get an A.",
          "If you want to predict where you'll end up in life, all you have to do is follow the curve of tiny gains or tiny losses, and see how your daily choices will compound ten or twenty years down the line. Are you spending less than you earn each month?",
          "The purpose of setting goals is to win the game. The purpose of building systems is to continue playing the game. You do not rise to the level of your goals. You fall to the level of your systems.",
        ],
      },
    ],
  },
  {
    id: "book-2",
    file: "book-2.pdf",
    title: "O'tkan Kunlar",
    subtitle: "Abdulla Qodiriy",
    chapters: [
      {
        title: "Birinchi bob: Kecli yoshlik",
        paragraphs: [
          "O'tmishda qolgan kunlarimizning xotirasi, meni bugungi kunga olib kelgan eng katta boylikdir. O'sha kunlarni eslaganim sari, ko'z oldimda O'zbekistonning boy hayoti, uning odamlari, ularning turmushi, urf-odatlari jonlanadi.",
          "Qodiriyning bu romani o'zbek adabiyotining eng qimmatli asarlaridan biri. Unda o'tgan asrning boshlaridagi O'zbekiston hayoti, jamiyatdagi o'zgarishlar, odamlar orasidagi munosabatlar haqida gapiriladi.",
          "Men o'sha kunlarni eslaganim sari, hayotning necha xil rangda ekanligini tushunaman. Quyoshli kunlar ham, bulutli kunlar ham — barchasi hayotimizning ajralmas qismi.",
        ],
      },
      {
        title: "Ikkinchi bob: Oila va muhabbat",
        paragraphs: [
          "Oiladagi muhabbat — inson hayotidagi eng qimmatli narsa. Ona qo'lining iliqligi, otaning mehnatsevarligi, aka-uka o'rtasidagi ishonch — bularning barchasi katta boylikdir.",
          "Romandagi qahramonlar hayoti orqali muallif bizga oilaning qadriga yetishni, yaqinlaringizni qadrlashni o'rgatadi. Hayotning eng katta baxti — bu oila davrasida bo'lish.",
          "Mehr-muhabbat va hurmat — bunyodiy qadriyatlar. Har bir inson o'z oilasini, o'z Vatanini sevishi kerak.",
        ],
      },
      {
        title: "Uchinchi bob: Jamiyat va o'zgarishlar",
        paragraphs: [
          "Jamiyat doimo o'zgarib turadi. Eski an'analari yangilanish bilan to'qnash kelganda, insonlar turlicha munosabat bildiradi. Kimdir yangilikni qarshi oladi, kimdir eski usulda qolishga harakat qiladi.",
          "O'zbek xalqining boy madaniy merosi — bu uning tarixi, adabiyoti, musiqasi va san'atidir. Mana shu merosni saqlash va kelajak avlodinga yetkazish — har bir avloding burchidir.",
          "Tarix bizga o'tmishdan saboq olishni, kelajakni yorqin qilish uchun hozirgi kunda mehnat qilishni o'rgatadi.",
        ],
      },
      {
        title: "To'rtinchi bob: Vatan sevgisi",
        paragraphs: [
          "Vatan — ona qo'g'irchoqcha, uni hech narsaga almasmaslik kerak. O'zbekistonning har bir qarag'ayi, har bir daryosi, har bir tog'i — bizning bebahoy mulkimizdir.",
          "Vatanni sevish — bu uning tarixini bilish, madaniyatini qadrlash, kelajagini qurishda ishtirok etish demakdir. Har bir inson o'z Vataniga hissa qo'shishi kerak.",
          "O'tmishda qolgan kunlarimiz — bizning kelajagimiz uchun poydevordir. Ana shu poydevor ustida yangi, obod hayot quramiz.",
        ],
      },
    ],
  },
  {
    id: "book-3",
    file: "book-3.pdf",
    title: "Fizika 9-sinf",
    subtitle: "Mehmon Baxtiyorov",
    chapters: [
      {
        title: "1-bob: Mexanika asoslari",
        paragraphs: [
          "Mexanika — fizikaning eng qadimiy va eng katta bo'limlaridan biri. U moddalarning harakati va bu harakatga ta'sir etuvchi kuchlarni o'rganadi. Mexanika ikki qismga bo'linadi: kinematika va dinamika.",
          "Kinematika — bu harakatni kuchlarni hisobga olmagan holda o'rganuvchi fizika bo'limi. Bu yerda tezlik, tezlanish, yo'l va vaqt o'rtasidagi bog'lanishlar o'rganiladi.",
          "Dinamika — bu harakatga sabab bo'lvchi kuchlarni o'rganuvchi fizika bo'limi. Nyutonning uchta qonuni dinamikaning asosini tashkil etadi.",
        ],
      },
      {
        title: "2-bob: Nyutonning qonunlari",
        paragraphs: [
          "Birinchi qonun (inersiya qonuni): Tashqi kuchlar ta'sir qilmagan harakatlanayotgan jism to'g'ri chiziq bo'ylab bir tekis harakatda qoladi. Masalan, stol ustidagi kitob turganicha turaveradi, chunki hech qanday kuch ta'sir qilmayapti.",
          "Ikkinchi qonun: Jismga ta'sir etuvchi kuchning miqdori massasi va tezlanishining ko'paytmasiga teng: F = ma. Bu qonun bizga harakatlanayotgan jismga ta'sir etuvchi kuchni hisoblash imkonini beradi.",
          "Uchinchi qonun: Har bir ta'sirga qarama-qarshi teng va teskari ta'sir mavjud. Agar biz qo'limizni stolga bosadigan bo'lsak, stol ham shunchalik kuch bilan bizning qo'limizga bosadi.",
        ],
      },
      {
        title: "3-bob: Mehnat va energiya",
        paragraphs: [
          "Mehnat — bu kuch va siljish yo'nalishi bo'yicha siljish miqdorining ko'paytmasi: A = F · s · cos α. Mehnatning o'lchov birligi — djoul (J).",
          "Kinetik energiya — bu harakatlanayotgan jismning energiyasi: Ek = mv²/2. Kinetik energiya massaga va tezlikning kvadratiga bog'liq.",
          "Potensial energiya — bu jismning joylashuviga bog'liq energiya. Gravitatsion potensial energiya Ep = mgh formulasi bilan hisoblanadi.",
          "Energiya saqlanish qonuni: Energiya na yaratiladi, na yo'q qilinadi, faqat bir shakldan ikkinchi shaklga o'tadi. Bu fizikaning eng muhim qonunlaridan biri.",
        ],
      },
      {
        title: "4-bob: Elektr zanjirlari",
        paragraphs: [
          "Elektr zanjiri — bu elektr tokining o'tishi uchun zarur bo'lgan yo'l. Zanjir tarkibiga manba, ulanish simlari va foydali yuk kiradi.",
          "Om qonuni: Zanjirdagi tok kuchining miqdori zanjir qismlaridagi kuch va qarshilikka bog'liq: I = U/R. Bu yerda I — tok kuchi (amper), U — kuchlanish (volt), R — qarshilik (om).",
          "Elektr zanjirlarida quvvat: P = UI = I²R = U²/R. Quvvatning o'lchov birligi — vatt (Vt).",
        ],
      },
    ],
  },
  {
    id: "book-4",
    file: "book-4.pdf",
    title: "Jismoniy tarbiya 8-sinf",
    subtitle: "Mehmon Baxtiyorov",
    chapters: [
      {
        title: "1-bob: Jismoniy tarbiyaning ahamiyati",
        paragraphs: [
          "Jismoniy tarbiya — bu insonning jismoniy sifatlarini (kuch, chidamlilik, tezlik, moslashuvchanlik) rivojlantirishga qaratilgan tizimli faoliyatdir.",
          "Maktab yoshidagi bolalarning jismoniy rivojlanishi ularning sog'lig'i, o'qish va mehnat qobiliyati, shuningdek, psixologik tiniqligi bilan bevosita bog'liq.",
          "Jismoniy tarbiya mashqlari yurak-qon tomir tizimini mustahkamlaydi, nafas olish tizimini yaxshilaydi, mushaklar tizimini rivojlantiradi va umuman olganda organizmning chidamliligini oshiradi.",
        ],
      },
      {
        title: "2-bob: Yugurish va uning turlari",
        paragraphs: [
          "Yugurish — bu eng qadimiy va tabiiy harakat turlaridan biri. Oddiy yugurish, tezkor yugurish, uzoq masofaga yugurish — barchasi turli xil sog'liq uchun foydali.",
          "Tekis yugurishda qo'llarning harakati, oyoqlarning qo'yilishi va nafas olish muvofiqlashtirilishi juda muhim. Qo'llar tana yaqinida oldinga-orqaga harakat qilishi kerak.",
          "Boshlang'ich va o'rta masofalarga yugurishda strategiya juda muhim. Tezlikni taqsimlash — yugurishning eng muhim qoidalaridan biri.",
        ],
      },
      {
        title: "3-bob: Gimnastika mashqlari",
        paragraphs: [
          "Gimnastika — bu turli xil harakatlar orqali jismoniy sifatlarni rivojlantirish, tana holatini yaxshilash va mushaklarni mustahkamlash mashqlari.",
          "Boshlang'ich gimnastika mashqlari: yurish, yugurish, sakrash, turgan holatda boshni burish, qo'l va oyoqlarni siljitish. Bu mashqlar har bir sport mashg'ulotidan oldin bajarilishi shart.",
          "Asosiy gimnastika mashqlari: qo'lda turish, qorin ustida turish, guruh harakatlari, muvozanat mashqlari. Bu mashqlar tana kuchini oshirishga yordam beradi.",
        ],
      },
      {
        title: "4-bob: Sport o'yinlari",
        paragraphs: [
          "Sport o'yinlari — bu guruh bo'lib o'ynaladigan, qoidalar asosida tashkil etilgan jismoniy faoliyat turi. Futbol, basketbol, voleybol, qo'l to'pi — eng mashhur sport o'yinlari.",
          "Futbol — dunyoning eng mashhur sport turi. Uning asosiy maqsadi — to'pni raqib darvozasiga kiritish. Har bir jamoa 11 nafar o'yinchidan tashkil topgan.",
          "Basketbol — besh kishidan iborat jamoalar o'ynaydigan sport o'yini. Uning maqsadi — to'pni raqib darvozasiga (yuqoridagi halqa) kiritishdir.",
          "Volleyball — olti kishidan iborat ikki jamoa o'rtasida o'ynaladigan sport o'yini. To'pni raqib maydoniga tushirish — asosiy maqsad.",
        ],
      },
    ],
  },
  {
    id: "book-5",
    file: "book-5.pdf",
    title: "A Brief History of Time",
    subtitle: "Stephen Hawking",
    chapters: [
      {
        title: "Chapter 1: Our Picture of the Universe",
        paragraphs: [
          "A well-known scientist once gave a public lecture on astronomy. He described how the earth orbits around the sun and how the sun, in turn, orbits around the center of a vast collection of stars called our galaxy. At the end of the lecture, a little old lady at the back of the room got up and said: 'What you have told us is rubbish. The world is really a flat plate supported on the back of a giant tortoise.'",
          "The scientist smiled and replied: 'What is the tortoise standing on?' 'You're very clever, young man, very clever,' said the old lady. 'But it's turtles all the way down!'",
          "Most people would find the picture of our universe as an infinite tower of tortoises rather ridiculous, but why do we think we know better? What do we know about the universe, and how did we find out?",
        ],
      },
      {
        title: "Chapter 2: The Expanding Universe",
        paragraphs: [
          "In 1929, Edwin Hubble made the landmark observation that wherever you look, distant galaxies are moving away from us. Moreover, the farther away they are, the faster they are moving away. This was completely unexpected, and completely contradicted the prevailing belief that the universe was static.",
          "The discovery that the universe is expanding was one of the greatest intellectual revolutions of the twentieth century. It meant that the universe had not existed forever. It implied that there must have been a moment in the past when everything in the universe was at the same place.",
          "If objects are moving apart now, it means that they must have been closer together in the past. If you reverse the expansion, you find that at some earlier time, all the objects in the universe were on top of each other.",
        ],
      },
      {
        title: "Chapter 3: Black Holes",
        paragraphs: [
          "A black hole is a region of space where gravity is so strong that nothing, not even light, can escape. The concept of a black hole was first proposed by John Michell in 1783, but it took nearly two centuries for the theory to be fully developed.",
          "The boundary of a black hole is called the event horizon. Once something crosses the event horizon, it can never escape. This is because to escape a black hole, you would need to travel faster than the speed of light, which is impossible according to Einstein's theory of relativity.",
          "Inside a black hole, our current understanding of physics breaks down. The density of matter at the center is thought to be infinite, a point called a singularity. At this point, the known laws of physics cease to work.",
        ],
      },
      {
        title: "Chapter 4: The Origin and Fate of the Universe",
        paragraphs: [
          "The Big Bang theory describes how the universe began from an infinitely hot and dense state, and has been expanding and cooling ever since. The universe is estimated to be approximately 13.8 billion years old.",
          "According to the Big Bang theory, the early universe went through a period of rapid expansion called inflation. During this brief period, the universe expanded by a factor of at least 10^26, smoothing out any irregularities.",
          "The ultimate fate of the universe depends on the amount of matter and energy it contains. If the density is high enough, gravity will eventually halt the expansion and cause the universe to collapse in a Big Crunch. If not, the universe will expand forever.",
        ],
      },
    ],
  },
  {
    id: "book-6",
    file: "book-6.pdf",
    title: "The Monk Who Sold His Ferrari",
    subtitle: "Robin Sharma",
    chapters: [
      {
        title: "Chapter 1: The Wake-Up Call",
        paragraphs: [
          "Julian Mantle was a brilliant lawyer. His career was the envy of his peers, his calendar was filled with high-profile cases, and his bank account overflowed with the spoils of his success. Yet his inner world was in a shambles.",
          "His relentless pursuit of professional success had cost him his health, his relationships, and his peace of mind. When he collapsed in the middle of a heated courtroom battle, it was a wake-up call that could no longer be ignored.",
          "From that moment, Julian began a journey of self-discovery that would transform his entire life. He sold his mansion, his Ferrari, and all his material possessions, and set off on a pilgrimage to the Himalayas.",
        ],
      },
      {
        title: "Chapter 2: Lessons from the Sages of Sivana",
        paragraphs: [
          "In the ancient and mystical land of Sivana, Julian discovered a group of sages who had unlocked the secrets of lasting happiness and inner peace. Their wisdom, passed down through generations, offered simple yet profound truths about living a meaningful life.",
          "The sages taught Julian about the Garden of the Mind, where our thoughts take root and grow. They showed him that we are the gardeners of our minds, and that by cultivating positive thoughts, we can create a life of joy and fulfillment.",
          "They also taught him the importance of daily rituals — simple practices performed consistently that have the power to transform every aspect of our lives.",
        ],
      },
      {
        title: "Chapter 3: The Ancient Rules of Sivana",
        paragraphs: [
          "Rule One: Master your emotions. The sages taught that a calm mind is the source of all great achievement. When you control your emotions, you control your destiny.",
          "Rule Two: Practice Kaizen. This is the art of continuous improvement. The sages believed that small, incremental improvements made daily would compound into remarkable results over time.",
          "Rule Three: Live with purpose. Without a clear sense of purpose, life becomes a meaningless series of random events. The sages encouraged Julian to discover his deepest values and align his life with them.",
          "Rule Four: The ancient art of time mastery. Time is our most precious resource, and how we use it determines the quality of our lives.",
        ],
      },
      {
        title: "Chapter 4: A Personal Philosophy",
        paragraphs: [
          "Julian learned that happiness is not something that happens to you. It is something you create through the way you think, the way you live, and the way you treat others.",
          "The sages showed him that true wealth is not measured in money or possessions, but in the richness of our experiences, the depth of our relationships, and the peace in our hearts.",
          "Upon returning to the Western world, Julian dedicated himself to sharing the wisdom he had gained, helping others find the same transformation he had experienced.",
        ],
      },
    ],
  },
  {
    id: "book-7",
    file: "book-7.pdf",
    title: "How to Win Friends and Influence People",
    subtitle: "Dale Carnegie",
    chapters: [
      {
        title: "Part 1: Fundamental Techniques in Handling People",
        paragraphs: [
          "Don't criticize, condemn, or complain. The worst possible way to begin any interaction with another human being is to start by criticizing them. Criticism is futile because it puts a person on the defensive and wounds their precious pride.",
          "Give honest and sincere appreciation. Everyone in the world has something they need — it is an intense craving for appreciation. Every human being craves to be appreciated.",
          "Arouse in the other person an eager want. The only way to influence people is to talk about what they want and show them how to get it.",
        ],
      },
      {
        title: "Part 2: Six Ways to Make People Like You",
        paragraphs: [
          "Become genuinely interested in other people. You can make more friends in two months by becoming interested in other people than you can in two years by trying to get other people interested in you.",
          "Smile. It costs nothing but creates much. It enriches those who receive it without impoverishing those who give it. It happens in a flash and the memory of it sometimes lasts forever.",
          "Remember that a person's name is to that person the sweetest and most important sound in any language. The way to a person's heart is to remember and use their name.",
          "Be a good listener. Encourage others to talk about themselves. People are far more interested in themselves and their own problems than they are in you and your problems.",
          "Talk in terms of the other person's interests. The person who has the ability to approach others and arouse in them an eager want has a great opportunity to influence them.",
        ],
      },
      {
        title: "Part 3: How to Win People to Your Way of Thinking",
        paragraphs: [
          "The only way to get the best of an argument is to avoid it. You can't win an argument. You can't because if you lose it, you lose it; and if you win it, you lose it.",
          "If you're wrong, admit it quickly and emphatically. When we are right, let's try to win people gently and tactfully to our way of thinking. When we are wrong, let's admit it quickly and enthusiastically.",
          "Begin in a friendly way. A drop of honey catches more flies than a gallon of gall. The same is true in human relations.",
        ],
      },
    ],
  },
  {
    id: "book-8",
    file: "book-8.pdf",
    title: "Word Power Made Easy",
    subtitle: "Norman Lewis",
    chapters: [
      {
        title: "Session 1: The Magic of Words",
        paragraphs: [
          "The English language is one of the most rich and diverse languages in the world. Its vocabulary has been enriched by centuries of contact with other languages and cultures, giving us an unparalleled wealth of words to express every shade of meaning.",
          "Building a powerful vocabulary is not about memorizing long lists of words. It is about understanding how words work — their roots, their connections, their family relationships.",
          "Every English word has a history. Most English words of three or more syllables come from Latin and Greek roots. Once you learn to recognize these roots, you can unlock the meaning of thousands of words.",
        ],
      },
      {
        title: "Session 2: Word Roots and Building Blocks",
        paragraphs: [
          "The Latin root 'duct' means 'to lead.' From this root we get: conduct (to lead together), produce (to lead forward), reduce (to lead back), educate (to lead out), introduce (to lead inside), deduce (to lead down/from).",
          "The Greek root 'graph' means 'to write.' From this root we get: biography (life writing), autobiography (self life writing), geography (earth writing), photograph (light writing), autograph (self writing).",
          "The Latin root 'port' means 'to carry.' From this root we get: transport (to carry across), import (to carry in), export (to carry out), report (to carry back), portable (able to be carried).",
        ],
      },
      {
        title: "Session 3: Expanding Your Vocabulary",
        paragraphs: [
          "Reading is the single most important activity for building vocabulary. Every time you read, you encounter words in context, which helps you understand their meaning and usage far better than any dictionary definition.",
          "Keep a vocabulary journal. When you encounter a new word, write it down along with its definition, its root, and an example sentence. Review your journal regularly.",
          "Practice using new words in conversation and writing. A word only becomes truly yours when you use it actively. The more you use a word, the more firmly it becomes embedded in your working vocabulary.",
        ],
      },
    ],
  },
  {
    id: "book-9",
    file: "book-9.pdf",
    title: "The Alchemist",
    subtitle: "Paulo Coelho",
    chapters: [
      {
        title: "Part One",
        paragraphs: [
          "The boy's name was Santiago. Dusk was falling as the boy arrived with his herd at an abandoned church. The roof had fallen in long ago, and an enormous sycamore had grown on the spot where the sacristy had once stood.",
          "He decided to spend the night there. He saw to it that all the sheep entered through the ruined gate, and then laid some planks across it to prevent the flock from wandering away during the night.",
          "There were only sheep in the world. But he had also learned something important about the world and about people. He had discovered that he could understand the language of the world around him.",
        ],
      },
      {
        title: "Part Two: The Crystal Merchant",
        paragraphs: [
          "The old man's name was Melchizedek. He told Santiago about Personal Legends — the thing that you have always wanted to accomplish. Everyone, when they are young, knows what their Personal Legend is.",
          "He told Santiago that when you want something, all the universe conspires in helping you to achieve it. This was the most important lesson the boy had ever learned.",
          "The crystal merchant showed Santiago the value of patience and the dangers of complacency. Despite having a dream of visiting Mecca, the merchant had never acted on it, choosing instead to wait for the right moment.",
        ],
      },
      {
        title: "Part Three: The Desert and the Alchemist",
        paragraphs: [
          "Santiago crossed the desert and arrived at the Al-Fayoum oasis, where he met Fatima, the woman of his life. She understood that his Personal Legend was more important than she was, and she supported him in pursuing it.",
          "The Alchemist taught Santiago that the Soul of the World was nourished by people's happiness. He taught him to listen to his heart, for it spoke the language of the world.",
          "Santiago learned that the pursuit of a Personal Legend is a person's most important obligation. He learned to read the omens that the universe placed before him.",
        ],
      },
      {
        title: "Part Four: The Treasure",
        paragraphs: [
          "After years of journeying, Santiago found his treasure — but it was not where he expected. It was buried right beneath the sycamore tree in the abandoned church where his journey had begun.",
          "This was the ultimate lesson: sometimes the treasure you seek is closer than you think. The journey itself was the treasure, for it had transformed Santiago from a simple shepherd into a man who understood the language of the world.",
          "He had followed his dream across an entire continent, through deserts and wars, through love and loss, and in the end, everything he had learned along the way was more valuable than gold.",
        ],
      },
    ],
  },
  {
    id: "book-10",
    file: "book-10.pdf",
    title: "Matematika 7-sinf",
    subtitle: "Mehmon Baxtiyorov",
    chapters: [
      {
        title: "1-bob: Natural sonlar va ular bilan amallar",
        paragraphs: [
          "Natural sonlar — bu 1, 2, 3, 4, ... sonlari. Zero (0) natural son hisoblanmaydi. Natural sonlar bilan qo'shish, ayirish, ko'paytirish va bo'lish amallari bajariladi.",
          "Ko'paytirish — bu bir xil sondagi sonlarni qo'shishning qisqartirilgan usuli. Masalan: 3 × 5 = 3 + 3 + 3 + 3 + 3 = 15.",
          "Bo'lish — bu ko'paytirishning teskari amali. Agar a × b = c bo'lsa, demak c : b = a va c : a = b.",
          "Ko'paytirish va bo'lish ustuvorligi: avval ko'paytirish yoki bo'lish, keyin qo'shish yoki ayirish bajariladi. Qavslar — bu ustuvorlikni belgilash uchun ishlatiladi.",
        ],
      },
      {
        title: "2-bob: Kasr sonlar",
        paragraphs: [
          "Kasr son — bu butun sonning qismi. Kasr son a/b ko'rinishida yoziladi, bu yerda a — surat, b — maxraj. Maxraj 0 ga teng bo'la olmaydi.",
          "Teng kasrlar — bu qiymatlari teng bo'lgan kasr sonlar. Masalan: 1/2 = 2/4 = 3/6. Kasr sonning surat va maxrajini bir xil songa ko'paytirsak yoki bo'lmasak, o'sha kasr son o'zgarmaydi.",
          "Kasrlarni solishtirish uchun ularni teng kasrlarga aylantirish kerak. Umumiy maxraj topilgandan keyin, kasrlarni bevosita solishtirish mumkin.",
        ],
      },
      {
        title: "3-bob: O'nli kasrlar",
        paragraphs: [
          "O'nli kasrlar — bu kasr sonning maxraji 10, 100, 1000 va hokazo bo'lgan holda ifodalangan turi. Masalan: 0.5 = 5/10, 0.25 = 25/100.",
          "O'nli kasrlarni qo'shish va ayirish uchun vergul (nuqta) ostidagi raqamlar soni teng bo'lishi kerak. Agar teng bo'lmasa, nol qo'shish kerak.",
          "O'nli kasrlarni ko'paytirish uchun: avval ularni natural sonlar sifatida ko'paytiramiz, keyin natijaga vergul ostidagi raqamlar soni qo'shiladi.",
        ],
      },
      {
        title: "4-bob: Geometriya asoslari",
        paragraphs: [
          "Chiziqli figuralar — bu to'g'ri chiziq bo'ylab yasalgan figuralar. Ular orasida to'rtburchak, uchburchak va boshqalar bor.",
          "Aylana — bu tekislikdagi barcha nuqtalar bir xil masofada joylashgan figura. Aylananing markazi va radiusi asosiy xossalari hisoblanadi.",
          "Yuza — bu figuraning tekislikdagi egallagan joyi. To'rtburchak yuzasi: S = a × b. Uchburchak yuzasi: S = (a × h) / 2.",
        ],
      },
    ],
  },
  {
    id: "book-11",
    file: "book-11.pdf",
    title: "Jannatda Ikki Boshli Qush",
    subtitle: "Chingiz Aytmatov",
    chapters: [
      {
        title: "1-bob: Qadimiy rivoyat",
        paragraphs: [
          "Qadimgi paytlarda o'zbek xalqi orasida jannatda ikki boshli qush yashagan degan rivoyat bor edi. Bu qush go'zalligi va aqlliligi bilan boshqa qushlardan farq qilgan.",
          "Aytmatovning bu romani qadimiy an'analar va zamonaviy hayot o'rtasidagi ziddiyatni ko'rsatadi. Qahramonlar o'z hayotida turli tanlovlar oldida turishadi.",
          "Roman qahramonlari orqali muallif inson qalbidagi ezgulik va yomonlik, sevgi va nafrat, ishonch va xiyonat o'rtasidagi kurashni aks ettiradi.",
        ],
      },
      {
        title: "2-bob: Zamonaviy hayot",
        paragraphs: [
          "Zamonaviy hayotda insonlar tezroq yashashga, ko'proq narsaga ega bo'lishga intilishadi. Lekin shu bilan birga, ruhiy boylik, madaniy meros va an'analarga e'tibor kamayib bormoqda.",
          "Roman qahramonlari orasida o'tmishni qadrlaydigan ham, kelajakka intilayotgan ham, hozirgi zamon bilan kurashayotgan ham odamlar bor.",
          "Aytmatov bizga o'rgatadiki, inson o'z ildizlarini unutmasligi, o'tmishidan saboq olishi, lekin kelajakka ham qarashi kerak.",
        ],
      },
      {
        title: "3-bob: Sevgi va sadoqat",
        paragraphs: [
          "Roman'dagi sevgi — bu oddiy emas, chuqur va murakkab his-tuyg'ular. Qahramonlar sevgi orqali o'zlarini topishadi, lekin sevgi ularni sinovdan ham o'tkazadi.",
          "Sadoqat — bu insonning eng qimmatli xususiyatlaridan biri. Qaysi sharoitda bo'lmasin, sadoqatli qolish — katta kuch talab qiladi.",
          "Aytmatovning asarlari bizga insoniy munosabatlarning eng nozik jihatlarini ko'rsatadi va ularning qadr-qimmatini tushuntiradi.",
        ],
      },
      {
        title: "4-bob: O'zbekiston manzaralari",
        paragraphs: [
          "Roman'dagi tabiat manzaralari — bu O'zbekistonning go'zalligini aks ettiruvchi tasvirlar. Tog'lar, daryolar, dalalar — barchasi hikoyaning bir qismi.",
          "Tabiat inson hayotida muhim rol o'ynaydi. U bizga tinchlik beradi, ilhom bag'ishlaydi va hayotimizni boyitadi.",
          "Aytmatov tabiatni insonning ajralmas qismi sifatida ko'rsatadi va unga hurmat bilan munosabatda bo'lishni o'rgatadi.",
        ],
      },
    ],
  },
  {
    id: "book-12",
    file: "book-12.pdf",
    title: "Dunyoning Ishlari",
    subtitle: "O'tkir Hoshimov",
    chapters: [
      {
        title: "1-bob: Hayotning mohiyati",
        paragraphs: [
          "Hayot — bu eng qimmatli va eng qisqa sovg'a. Har bir inson o'z hayotini mazmunli va foydali o'tkazishga intilishi kerak.",
          "Hoshimovning bu romani o'zbek xalqining hayoti, ularning quvonchlari va xursandliklari, hamda mushkulotlari haqida gapiradi.",
          "Roman qahramonlari orqali biz hayotning turli tomonlarini ko'ramiz — sevgi, mehnat, do'stlik, sadoqat va hamjihatlik.",
        ],
      },
      {
        title: "2-bob: O'zbek an'anasi",
        paragraphs: [
          "O'zbek xalqining boy an'anasi — bu uning eng katta boyligi. Mehmondo'stlik, kattalarni hurmat qilish, yoshlarga g'amxo'rlik qilish — bularning barchasi an'analarning bir qismi.",
          "Navro'z, Ramazon, Korbon hayitlari — xalqimizning eng sevimli bayramlari. Ular bizni birlashtiradi va ruhiy boyitimizni oshiradi.",
          "An'analarni saqlash va davom ettirish — har bir avloding burchidir. Biz o'tmishimizdan faxrlanishimiz va kelajagimiz uchun ishlashimiz kerak.",
        ],
      },
      {
        title: "3-bob: Insoniy munosabatlar",
        paragraphs: [
          "Insoniy munosabatlar — bu hayotning eng muhim jihati. Do'stlik, sevgi, hamjihatlik — bular bizni haqiqiy boy qiladi.",
          "Hoshimov romanda oilaviy munosabatlarni, qo'shnilik, hamkasablik va boshqa ijtimoiy aloqalarni chuqur tasvirlab beradi.",
          "Yomon odam yo'q, yomon vaziyat bor — degan falsafa romanda o'z aksini topgan. Insonlar bir-birini tushunishi va qo'llab-quvvatlashi kerak.",
        ],
      },
      {
        title: "4-bob: Vatan va xalq",
        paragraphs: [
          "Vatan — bu ona yurtimiz, uning tuprog'i, havosi, suvi, odamlari. Vatanni sevish — bu eng ulug'vord his.",
          "Xalqimizning boy tarixi, madaniy merosi va an'anasi — bu bizning faxrimizdir. Uni saqlash va rivojlantirish — har bir fuqaroning burchi.",
          "Hoshimov bizga Vatan sevgisini, xalqqa sadoqatni va hayotning qadrini o'rgatadi. Bu adabiyot — bizning milliy boyligimiz.",
        ],
      },
    ],
  },
  {
    id: "book-13",
    file: "book-13.pdf",
    title: "Fizika 8-sinf",
    subtitle: "Mehmon Baxtiyorov",
    chapters: [
      {
        title: "1-bob: Harakat",
        paragraphs: [
          "Harakat — bu moddaning vaqti o'tishi bilan o'z joyini o'zgartirishi. Harakat absolut (nisbiy emas) va nisbiy (absolut emas) bo'ladi.",
          "Tezlik — bu yo'lning vaqtga nisbati: v = s/t. Tezlikning o'lchov birligi — metr sekundda (m/s). Tez vektoriyalik kuch — uning miqdori va yo'nalishi bor.",
          "Tezlanish — bu tezlikning o'zgarish tezligi: a = Δv/Δt. Agar tezlik o'zgarsa, jism tezlanadi yoki sekinlashadi.",
        ],
      },
      {
        title: "2-bob: Kuchlar",
        paragraphs: [
          "Kuch — bu modaning holatini o'zgartira oladigan yoki o'zgartirishga moyil bo'lgan ta'sir. Kuchning o'lchov birligi — nyuton (N).",
          "Gravitatsion kuch — bu Yer yuzasidagi barcha predmetlarga ta'sir etuvchi kuch: F = mg. Bu yerda m — massa (kg), g = 9.8 m/s² — erkin tushish tezlanishi.",
          "Elastik kuch — bu cho'zilgan yoki siqilgan elastik tayoq yoki prujinaga ta'sir etuvchi kuch. Huk qonuni: F = -kx.",
        ],
      },
      {
        title: "3-bob: Ish va quvvat",
        paragraphs: [
          "Ish — bu kuchning siljish yo'nalishi bo'yicha ishlashi: A = F · s. Ishning o'lchov birligi — djoul (J).",
          "Quvvat — bu ish bajarish tezligi: P = A/t. Quvvatning o'lchov birligi — vatt (Vt).",
          "Mekanik energiya — bu potensial va kinetik energiyalar yig'indisi. Energiya saqlanish qonuni: energiya na yaratiladi, na yo'q qilinadi.",
        ],
      },
      {
        title: "4-bob: Bosim",
        paragraphs: [
          "Bosim — bu kuchning yuzaga nisbati: p = F/S. Bosimning o'lchov birligi — paskal (Pa).",
          "Gidrostatik bosim — suyuqlik ustunining bosimi: p = ρgh. Bu yerda ρ — zichlik, g — erkin tushish tezlanishi, h — suyuqlik ustunining balandligi.",
          "Paskal qonuni: suyuqlikka qo'llanilgan bosim har tomonga bir xilda tarqaladi. Bu qonun gидравлик тizimlarida keng qo'llaniladi.",
        ],
      },
    ],
  },
  {
    id: "book-14",
    file: "book-14.pdf",
    title: "Matematika 9-sinf",
    subtitle: "Mehmon Baxtiyorov",
    chapters: [
      {
        title: "1-bob: Ifodalar va tenglamalar",
        paragraphs: [
          "Algebraik ifoda — bu sonlar, o'zgaruvchilar va amallar kombinatsiyasi. Ifodani soddalashtirish — bir xil hadlarni qo'shish yoki ayirish orqali bajariladi.",
          "Tenglama — bu ikki ifoda o'rtasidagi tenglik belgisi bilan bog'langan ifoda. Tenglamaning yechimi — bu tenglamaning o'rinli bo'lgan o'zgaruvchi qiymati.",
          "Chiziqli tenglamalar: ax + b = 0. Bu tenglamaning yechimi: x = -b/a (a ≠ 0). Bir noma'lumli tenglamalar tizimi: ikki tenglamadan iborat bo'lib, ularning yechimi umumiy nuqta.",
        ],
      },
      {
        title: "2-bob: Kvadrat tenglamalar",
        paragraphs: [
          "Kvadrat tenglama — bu ikkinchi darajali tenglama: ax² + bx + c = 0 (a ≠ 0).",
          "Diskriminant: D = b² - 4ac. Agar D > 0 bo'lsa, tenglamaning ikki ildizi bor. Agar D = 0 bo'lsa, bir ildiz bor. Agar D < 0 bo'lsa, ildiz yo'q.",
          "Kvadrat tenglamaning ildizlari: x = (-b ± √D) / (2a). Bu formula har qanday kvadrat tenglamani yechish imkonini beradi.",
        ],
      },
      {
        title: "3-bob: Funksiyalar",
        paragraphs: [
          "Funksiya — bu ikki to'plam orasidagi bog'lanish. Har bir kirish qiymatiga faqat bitta chiqish qiymati mos kelishi kerak.",
          "Chiziqli funksiya: y = kx + b. Bu funksiyaning grafigi to'g'ri chiziq. k — burchak koeffitsienti, b — kesma.",
          "Kvadrat funksiya: y = ax² + bx + c. Bu funksiyaning grafigi parabolada. Parabolanning cho'qqisi: x₀ = -b/(2a), y₀ = f(x₀).",
        ],
      },
      {
        title: "4-bob: Ehtimollik",
        paragraphs: [
          "Ehtimollik — bu hodisaning sodir bo'lish ehtimoli. Ehtimollik 0 dan 1 gacha bo'lgan son bilan ifodalanadi.",
          "Ob-havo ehtimoli: P(A) = m/n, bu yerda m — qulay natijalar soni, n — barcha mumkin bo'lgan natijalar soni.",
          "Bir vaqtda sodir bo'lmaydigan hodisalar: P(A + B) = P(A) + P(B). Bir-biriga ta'sir etmaydigan hodisalar: P(A · B) = P(A) · P(B).",
        ],
      },
    ],
  },
  {
    id: "book-15",
    file: "book-15.pdf",
    title: "Ingliz tili 5-sinf",
    subtitle: "Mehmon Baxtiyorov",
    chapters: [
      {
        title: "1-bob: Salomlashish va tanishish",
        paragraphs: [
          "Hello! My name is... — Salom! Mening ismim...",
          "How are you? — Qalaysiz? I am fine, thank you. — Yaxshiman, rahmat.",
          "Nice to meet you. — Tanishganligimdan xursandman. Where are you from? — Siz qayerdansiz? I am from Uzbekistan. — Men O'zbekistondanman.",
          "What is this? — Bu nima? This is a book. — Bu kitob. That is a pen. — U ruchka.",
        ],
      },
      {
        title: "2-bob: Sonlar va ranglar",
        paragraphs: [
          "One, two, three, four, five, six, seven, eight, nine, ten — Bir, ikki, uch, to'rt, besh, olti, yetti, sakkiz, to'qqiz, o'n.",
          "Red — qizil, Blue — ko'k, Green — yashil, Yellow — sariq, White — oq, Black — qora, Orange — naranji, Purple — binafsha.",
          "How many? — Nechta? There are five apples. — Besh ta olma bor. I have three books. — Menda uchta kitob bor.",
        ],
      },
      {
        title: "3-bob: kunlar va oylar",
        paragraphs: [
          "Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday — Dushanba, Seshanba, Chorshanba, Payshanba, Juma, Shanba, Yakshanba.",
          "January, February, March, April, May, June, July, August, September, October, November, December — Yanvar, Fevral, Mart, Aprel, May, Iyun, Iyul, Avgust, Sentabr, Oktabr, Noyabr, Dekabr.",
          "What day is it today? — Bugun qanaqa kun? Today is Monday. — Bugun dushanba. When is your birthday? — Tug'ilgan kuningiz qachon?",
        ],
      },
      {
        title: "4-bob: Oila va uy",
        paragraphs: [
          "This is my family. — Bu mening oilam. Father — ota, Mother — ona, Brother — aka/uka, Sister — opa/singil, Grandfather — bobo, Grandmother — buvi.",
          "I live in a house. — Men uyda yashayman. My house has three rooms. — Mening uyimda uchta xona bor. There is a kitchen, a bedroom, and a living room. — Oshxona, yotoq xona va mehmonxona bor.",
          "My father works at a school. — Mening otam maktabda ishlaydi. My mother is a doctor. — Mening onam shifokor. I go to school every day. — Men har kuni maktabga boraman.",
        ],
      },
    ],
  },
  {
    id: "book-16",
    file: "book-16.pdf",
    title: "Deep Work",
    subtitle: "Cal Newport",
    chapters: [
      {
        title: "Rule 1: Work Deeply",
        paragraphs: [
          "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time.",
          "The ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy. As a consequence, the few who cultivate this skill will thrive.",
          "To make deep work a habit, you need routines and rituals — dedicated times and places for focused work that you don't need to deliberate on each time.",
        ],
      },
      {
        title: "Rule 2: Embrace Boredom",
        paragraphs: [
          "The ability to concentrate deeply is a skill that must be trained. If you don't train your mind to be able to resist distraction, you'll be left behind.",
          "The key to developing a deep work habit is to move beyond good intentions. You need specific rules and rituals that minimize the amount of willpower you need to transition to deep work.",
          "Internet scheduling is an effective strategy: instead of fighting the constant pull of the internet, schedule specific times for internet use and focus entirely on deep work the rest of the time.",
        ],
      },
      {
        title: "Rule 3: Quit Social Media",
        paragraphs: [
          "Social media tools are designed to be addictive — ruminating their use for leisure and entertainment with no direct benefit to your professional or personal life is a significant mistake.",
          "The craftsman approach to tool selection: adopt a tool only if its positive impacts substantially outweigh its negative impacts. Apply this criterion thoughtfully to your current tools.",
          "Don't use the internet to entertain yourself. At the end of the workday, you'll often find it hard to stop. This is because your mind needs a break from the constant context switching.",
        ],
      },
      {
        title: "Rule 4: Drain the Shallows",
        paragraphs: [
          "Shallow work is the non-cognitively demanding, logistical-style tasks, often performed while distracted. These efforts tend to not create much new value in the world and are easy to replicate.",
          "Schedule every minute of your day. Time blocking — the practice of planning every minute of your workday — can dramatically increase your capacity for deep work.",
          "Set a strict deadline for your deep work. If you have an open-ended amount of time to complete a task, you'll naturally slow down and let your focus wane.",
        ],
      },
    ],
  },
  {
    id: "book-17",
    file: "book-17.pdf",
    title: "O'zbekiston Tarixi",
    subtitle: "Mehmon Baxtiyorov",
    chapters: [
      {
        title: "1-bob: Qadimiy davr",
        paragraphs: [
          "O'zbekiston hududida inson yashaganligi haqida eng qadimiy dalillar miloddan avvalgi 100 ming yillikka borib taqaladi. Bu hudud — qadimiy madaniyatlar markazi bo'lgan.",
          "Sog'diana, Xorazm, Buxoro va Samarqand — qadimiy sivilizatsiyalarning markazlari bo'lib, ular savdo yo'llari orqali Sharq va G'arbni bog'lagan.",
          "Amir Temur (1336-1405) — buyuk sarkarda va davlat arbobi. Uning davrida O'zbekiston hududida ulug'vor imperiya barpo etilgan va madaniyat rivojlangan.",
        ],
      },
      {
        title: "2-bob: O'rta asrlar",
        paragraphs: [
          "Samarqand — Buyak Ipak Yo'lining markazidir. Bu yerda turli xalqlar o'z mahsulotlarini almashtirib, madaniy boyitishgan.",
          "Buxoro Xonligi (1500-1920) — Markaziy Osiyodagi eng muhim davlatlardan biri. Buxoro — ilm-fan va madaniyat markazi sifatida dunyoga mashhur bo'lgan.",
          "Xiva Xonligi — ho'zirgi Xorazm viloyatidagi davlat. Bu yerda an'anaviy hunarmandchilik va madaniyat yuqori darajada rivojlangan.",
        ],
      },
      {
        title: "3-bob: Mustaqillik yo'li",
        paragraphs: [
          "1991-yil 31-avgust — O'zbekiston Respublikasi mustaqilligini e'lon qilgan kun. Bu tarixiy sana xalqimizning eng muhim bayrami.",
          "Mustaqillik yillarida O'zbekiston iqtisodiy, siyosiy va madaniy jihatdan katta o'zgarishlarni boshdan kechirdi.",
          "O'zbekiston xalqaro hamjamiyatda o'z o'rnini topdi va turli xalqaro tashkilotlar a'zosi bo'ldi.",
        ],
      },
      {
        title: "4-bob: Zamonaviy O'zbekiston",
        paragraphs: [
          "Bugungi O'zbekiston — yoshlar mamlakati. Aholining katta qismi yosh va o'smirlar tashkil etadi.",
          "Ta'lim va fan sohasida katta yutuqlar qo'lga kiritilmoqda. Yangi universitetlar, ilmiy markazlar va ta'lim muassasalari ochilmoqda.",
          "O'zbekistonning boy tabiiy resurslari — neft, gaz, oltin, uran va boshqa foydali qazilmalar — mamlakat iqtisodiyotining asosini tashkil etadi.",
        ],
      },
    ],
  },
  {
    id: "book-18",
    file: "book-18.pdf",
    title: "Think and Grow Rich",
    subtitle: "Napoleon Hill",
    chapters: [
      {
        title: "Chapter 1: Thoughts Are Things",
        paragraphs: [
          "Truly, 'thoughts are things,' and powerful things at that, when they are mixed with definiteness of purpose, persistence, and a burning desire for their translation into riches or other material objects.",
          "The starting point of all achievement is DESIRE. Keep this constantly in mind. Weak desire brings weak results, just as a small fire makes a small amount of heat.",
          "When you begin to THINK AND GROW RICH, you will observe that riches begin with a state of mind, with definiteness of purpose, with little or no hard work.",
        ],
      },
      {
        title: "Chapter 2: Desire, the Starting Point",
        paragraphs: [
          "All achievement, all earned riches, must begin with desire. A burning desire is the starting point of all accomplishment. Just as a small amount of fire cannot produce much heat, a weak desire cannot produce great results.",
          "The method for converting desire into money consists of six definite steps: Fix in your mind the exact amount of money you desire. Determine exactly what you intend to give in return for the money.",
          "Establish a definite date when you intend to possess the money you desire. Create a definite plan for carrying out your desire and begin at once.",
        ],
      },
      {
        title: "Chapter 3: Faith, Visualization of, and Belief in Attainment of Desire",
        paragraphs: [
          "Faith is the visualization of and belief in the attainment of desire. Faith is the 'chemical' which, when mixed with thought, gives the mind a strange power to attract the things that harmonize with the belief.",
          "Self-confidence formula: I know I have the ability to achieve my definite purpose, and I DEMAND of myself persistent, continuous action toward its attainment.",
          "All the emotions which have been mixed with faith — all the positive emotions — serve as catalysts for the creation of wealth.",
        ],
      },
      {
        title: "Chapter 4: Auto-suggestion, the Medium",
        paragraphs: [
          "Auto-suggestion is the medium for influencing the subconscious mind. It is the agency of communication between the conscious and subconscious minds.",
          "Through auto-suggestion, any desire that you consistently plant in your subconscious mind will eventually be accepted by it and acted upon through the most practical methods available.",
          "The subconscious mind will translate a thought impulse of a financial nature into its physical equivalent by the most practical procedure available.",
        ],
      },
    ],
  },
  {
    id: "book-19",
    file: "book-19.pdf",
    title: "Rus tili 6-sinf",
    subtitle: "Mehmon Baxtiyorov",
    chapters: [
      {
        title: "1-bob: Salomlashish va tanishish",
        paragraphs: [
          "Здравствуйте! — Zdravstvuyte! (Assalomu alaykum!) Как вас зовут? — Kak vas zovut? (Ismingiz nima?) Меня зовут... — Menya zovut... (Mening ismim...)",
          "Как дела? — Kak dela? (Qalaysiz?) Хорошо, спасибо. — Khorosho, spasibo. (Yaxshiman, rahmat.) Очень приятно. — Ochen priyatno. (Juda yoqimli.)",
          "Где вы живёте? — Gde vy zhivyote? (Siz qayerda yashaysiz?) Я живу в Узбекистане. — Ya zhivu v Uzbekistane. (Men O'zbekistonda yashayman.)",
        ],
      },
      {
        title: "2-bob: Sonlar va ranglar",
        paragraphs: [
          "Один, два, три, четыре, пять, шесть, семь, восемь, девять, десять — Odin, dva, tri, chetyre, pyat, shest, sem, vosem, devyat, desyat.",
          "Красный — krasniy (qizil), Синий — siniy (ko'k), Зелёный — zelyoni (yashil), Жёлтый — zholty (sariq), Белый — beliy (oq), Чёрный — chorniy (qora).",
          "Сколько? — Skolko? (Nechta?) Это красное яблоко. — Eto krasnoye yabloko. (Bu qizil olma.) У меня три учебника. — U menya tri uchebnika. (Menda uchta darslik bor.)",
        ],
      },
      {
        title: "3-bob: Kunlar va oylar",
        paragraphs: [
          "Понедельник, Вторник, Среда, Четверг, Пятница, Суббота, Воскресенье — Ponedelnik, Vtornik, Sreda, Chetverg, Pyatnitsa, Subbota, Voskreseniye.",
          "Январь, Февраль, Март, Апрель, Май, Июнь, Июль, Август, Сентябрь, Октябрь, Ноябрь, Декабрь — Yanvar, Fevral, Mart, Aprel, May, Iyun, Iyul, Avgust, Sentyabr, Oktyabr, Noyabr, Dekabr.",
          "Какой сегодня день? — Kakoy segodnya den? (Bugun qanaqa kun?) Сегодня понедельник. — Segodnya ponedelnik. (Bugun dushanba.)",
        ],
      },
      {
        title: "4-bob: Oila va uy",
        paragraphs: [
          "Это моя семья. — Eto moya semya. (Bu mening oilam.) Папа, мама, брат, сестра, дедушка, бабушка — Papa, mama, brat, sestra, dedushka, babushka.",
          "Я живу в доме. — Ya zhivu v dome. (Men uyda yashayman.) В моём доме три комнаты. — V moyom dome tri komnaty. (Mening uyimda uchta xona bor.)",
          "Мой папа работает в школе. — Moy papa rabotayet v shkole. (Mening otam maktabda ishlaydi.) Я хожу в школу каждый день. — Ya khozhu v shkolu kazhdyy den. (Men har kuni maktabga boraman.)",
        ],
      },
    ],
  },
  {
    id: "book-20",
    file: "book-20.pdf",
    title: "Biologiya 7-sinf",
    subtitle: "Mehmon Baxtiyorov",
    chapters: [
      {
        title: "1-bob: Zambil — organizmning tuzilishi",
        paragraphs: [
          "Zambil — bu oddiy ko'p hujayrali organizm. U suvda yashaydi va suv o'tlari bilan oziqlanadi. Zambilning tuzilishi juda oddiy, lekin uning hayot sikli juda qiziqarli.",
          "Zambilning asosiy organlari: tana, bosh, oyoqlar va qanotlar. Zambil suvga kirganda oyoqlari qanot shakliga kiradi va suzish uchun ishlatiladi.",
          "Zambil rivojlanishi: tuxum — lichinka — pupochka — katta zambil. Bu jarayon metamorfoz (o'zgarish) deb ataladi.",
        ],
      },
      {
        title: "2-bob: O'simliklar dunyosi",
        paragraphs: [
          "O'simliklar — Yer yuzasidagi eng muhim organizmlardan biri. Ular kislorod ishlab chiqaradi, tuproqni saqlaydi va barcha tirik mavjudotlar uchun oziq-ovqat manbayi.",
          "O'simlik hujayrasi: devor (sellyuloza), sitoplazma, yadro, xloroplastlar, vakuola. Xloroplastlar — bu o'simlikning 'fabrikasi', u erda fotosintez sodir bo'ladi.",
          "Fotosintez: 6CO₂ + 6H₂O + yorug'lik energiyasi → C₆H₁₂O₆ + 6O₂. Bu jarayonda o'simliklar karbonat angidrini va suvni glyukoza va kislorodga aylantiradi.",
        ],
      },
      {
        title: "3-bob: Hayvonlar dunyosi",
        paragraphs: [
          "Hayvonlar — bu yeyuvchi (heterotrof) organizmlar. Ular boshqa organizmlar bilan oziqlanadi. Hayvonlar xilma-xilligi juda katta — bir hujayralidan ko'p hujayraligacha.",
          "Umurtqasizlar: bacaklar, qisqichbaqasimonlar, hasharotlar. Hasharotlar — eng katta guruh. Ularning 3 ta juft oyoqlari, 2 juft qanotlari va 1 juft birikkan antenalari bor.",
          "Umurtqalilar: baliqlar, amfibiyalar (o'rgimchaklar), surtuvchilar (kemiruvchilar, qushlar, sutemizuvchilar). Sutemizuvchilar — eng rivojlangan hayvonlar guruhi.",
        ],
      },
      {
        title: "4-bob: Ekologiya",
        paragraphs: [
          "Ekologiya — bu organizmlarning o'zaro hamda muhit bilan o'zaro ta'sirini o'rganuvchi fan. Ekologiya darajalari: populyatsiya, biotsenoz, biogeotsenoz.",
          "Muhit omillari: abiotik (harorat, yorug'lik, namlik, tuproq) va biotik (oziq-ovqat, yirtqichlar, raqobat). Organizmlar bu omillarga moslashadi.",
          "Insonning tabiatga ta'siri: havo va suv ifloslanishi, o'rmalarni kesish, hayvonlarning yo'q bo'lib ketishi. Tabiatni muhofaza qilish — har bir insonning burchidir.",
        ],
      },
    ],
  },
];

// ─── Generate PDFs ──────────────────────────────────────────

console.log("📚 MBSI Library — PDF Book Generator");
console.log("─".repeat(50));

let totalGenerated = 0;

for (const book of BOOKS) {
  const writer = new PDFWriter();

  // Title page
  writer.newPage();
  writer.space(4);
  writer.title(book.title);
  writer.space(1);
  writer.subtitle(book.subtitle);
  writer.space(2);
  writer.separator();
  writer.space(1);
  writer.paragraph("MBSI Library — Onlayn kutubxona");
  writer.paragraph("www.mbsi-library.uz");
  writer.space(2);
  writer.text("— MBSI Maktabi —", { size: 14, bold: true });
  writer.space(2);
  writer.text("Bu kitob faqat online o'qish uchun mo'ljallangan.", { size: 10 });
  writer.text("Yuklab olish o'chirilgan.", { size: 10 });

  // Content pages
  let pageCount = 1; // title page
  for (const chapter of book.chapters) {
    writer.newPage();
    pageCount++;
    writer.chapter(chapter.title);
    writer.space(0.5);
    for (const para of chapter.paragraphs) {
      writer.paragraph(para);
      writer.space(0.3);
    }
  }

  // Write to file
  const filePath = path.join(PRIVATE_ROOT, book.file);
  fs.writeFileSync(filePath, writer.toBuffer());
  totalGenerated++;

  const sizeKB = Math.round(fs.statSync(filePath).size / 1024);
  console.log(`✅ ${book.file.padEnd(16)} ${book.title.padEnd(35)} ${pageCount} pages  ${sizeKB} KB`);
}

console.log("─".repeat(50));
console.log(`🎉 Generated ${totalGenerated} PDF books (${BOOKS.length * 3}+ pages total)`);
console.log(`📁 Stored in: ${PRIVATE_ROOT}`);

// Generate a mapping file for the seed script
const mapping = BOOKS.map((b) => ({
  id: b.id,
  file: b.file,
  title: b.title,
}));
fs.writeFileSync(
  path.join(import.meta.dirname, "pdf-manifest.json"),
  JSON.stringify(mapping, null, 2)
);
console.log(`📄 Manifest: scripts/pdf-manifest.json`);
