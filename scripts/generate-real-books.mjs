#!/usr/bin/env node
// ============================================================
// MBSI Library — Generate Real PDF Books
// ============================================================
// Creates multi-page PDF books with proper text rendering.
// ============================================================

import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { join } from "path";

const PDF_DIR = join(import.meta.dirname, "..", "storage", "private", "pdfs");

const BOOK_CONTENT = {
  "book-1": {
    title: "Atomic Habits",
    author: "James Clear",
    chapters: [
      { title: "Introduction: The Surprising Power of Atomic Habits", text: "Habits are the compound interest of self-improvement. The same way that money multiplies through compound interest, the effects of your habits multiply as you repeat them. They seem to make little difference on any given day and yet the impact they deliver over the months and years can be enormous.\n\nThis can be a difficult concept to appreciate in daily life. We often dismiss small changes because they don't seem to matter very much in the moment. If you save a little money now, you're still not a millionaire. If you go to the gym three days in a row, you're still out of shape.\n\nThe problem is not that the changes are ineffective—it's that we think they need to be big to matter. Your outcomes are a lagging measure of your habits. Your net worth is a lagging measure of your financial habits. Your weight is a lagging measure of your eating habits." },
      { title: "Chapter 1: How Your Habits Shape Your Identity", text: "There are three layers of behavior change: outcomes, processes, and identity. Outcomes are about what you get. Processes are about what you do. Identity is about what you believe.\n\nMost people set goals for the outcome they want to achieve. Identity-based habits are about who you wish to become. The ultimate form of intrinsic motivation is when a habit becomes part of your identity.\n\nEvery action you take is a vote for the type of person you wish to become. No single instance will transform your beliefs, but as the votes build up, so does the evidence of your new identity." },
      { title: "Chapter 2: The 1st Law - Make It Obvious", text: "In 2001, researchers in the United Kingdom ran a study to determine which factors most predicted whether a person would become a regular gym-goer. They studied 266 individuals who had signed up for a 12-week exercise program.\n\nThe motivation group showed almost no improvement. Only 35% of them exercised each week. The planning group exercised 91% of the time. The best way to break a bad habit is to make it impractical.\n\nThe cue needs to be obvious. You can't change what you don't notice. Try a habit scorecard. List your daily habits and mark each as positive, negative, or neutral." },
      { title: "Chapter 3: The 2nd Law - Make It Attractive", text: "In 1954, behavioral psychologist James Olds and Peter Milner conducted an experiment that would change our understanding of motivation forever. They had accidentally stumbled upon the brain's pleasure center.\n\nDopamine drives our desire to seek. It's not about the pleasure of having something—it's about the anticipation of getting something. Every behavior that is sufficiently rewarded becomes habit-forming.\n\nWe need to make our habits attractive. Temption bundling is a strategy: pair an action you want to do with an action you need to do." },
      { title: "Conclusion: The Secret to Self-Control", text: "The people who seem to have remarkable self-control actually aren't that different from the rest of us. They aren't relying on their willpower. They design their environment to minimize temptation.\n\nThe key to changing your behavior is not about trying harder, but about designing your environment better. Once you understand how habits work, you can design your environment to make your desired behaviors easier and your undesired behaviors harder.\n\nHabits are the compound interest of self-improvement. Getting 1 percent better every day counts for a lot in the long-run." }
    ]
  },
  "book-2": {
    title: "O'tkan Kunlar",
    author: "Abdulla Qodiriy",
    chapters: [
      { title: "Birinchi qism", text: "Abdulla Qodiriyning O'tkan Kunlar romani o'zbek adabiyotining eng mashhur asarlaridan biri hisoblanadi. U 1920-yillardagi O'zbekiston hayotini aks ettiradi.\n\nRoman O'sha davrning ijtimoiy-siyosiy voqealarini, odamlar hayotini, ularning intilish va orzularini bayon qiladi. Asarda O'zbekiston xalqining boy madaniy merosi, urf-odatlari va an'analari yorqin tasvirlab berilgan.\n\nQodiriy o'z asarida millatning ertangi kuniga ishonch, yosh avlodning kelajakka umid bilan qarashini ko'rsatgan." },
      { title: "Ikkinchi qism", text: "O'tkan Kunlar romani nafaqat adabiy, balkim ijtimoiy ahamiyatga ham ega. Asarda ta'lim-tarbiya masalalari, oila qadriyatlari, jamiyat hayotidagi o'zgarishlar batafsil tasvirlangan.\n\nRoman qahramonlari orqali muallif o'zbek xalqining ma'naviy boyligini, ularning hayotga bo'lgan munosabatini, sevgi va sadoqatini ko'rsatadi.\n\nAsar tilining go'zalligi va jo'shinligi unga maxsus charm beradi." }
    ]
  },
  "book-3": {
    title: "Fizika 9-sinf",
    author: "Mehmon Baxtiyorov",
    chapters: [
      { title: "1-Bob: Mexanika asoslari", text: "Fizika — tabiatni o'rganuvchi fan. U moddaning tuzilishi, harakati va o'zgarishini o'rganadi.\n\nMexanika — fizikaning eng qadimiy bo'limi. U jismlarning harakati va unda kuchlarning ta'sirini o'rganadi.\n\nNeytonning birinchi qonuni: Harakatlanmayotgan jism harakatlanish holatida qoladi va faqat tashqi kuch ta'sirida bu holatini o'zgartiradi.\n\nNeytonning ikkinchi qonuni: Jismga ta'sir etuvchi kuch uning tezligini o'zgartiradi. F = m * a formulasi orqali ifodalanadi." },
      { title: "2-Bob: Kuch va harakat", text: "Kuch — bu modaga ta'sir etuvchi omil. Kuchning o'lchov birligi Nyuton (N) bo'lib, 1 N = 1 kg * 1 m/s2.\n\nGravitatsiya kushi: F = G * m1 * m2 / r2. Bu formula ikki jism orasidagi tortishish kuchini hisoblash imkonini beradi.\n\nFriksiya kuchi — bu harakatlanayotgan jismga qarshi yo'nalishda ta'sir etuvchi kuch.\n\nImpuls — kuchning vaqt integrallari. I = F * t." },
      { title: "3-Bob: Energiya va ish", text: "Ish — bu kuchning yo'nalishidagi ko'chishi. W = F * s * cos(alpha) formulasida ifodalanadi.\n\nKinetik energiya: Ek = 1/2 * m * v2. Bu jismning harakatlanishiga qarab o'zgaradi.\n\nPotensial energiya: Ep = m * g * h. Bu jismning balandlikka ko'tarilishi bilan oshadi.\n\nMekanik energiya saqlanish qonuni: Tizimning umumiy mexanik energiyasi tashqi kuchlar ta'sirida o'zgarmaydi." }
    ]
  },
  "book-4": {
    title: "Jismoniy tarbiya 8-sinf",
    author: "Mehmon Baxtiyorov",
    chapters: [
      { title: "1-Bob: Jismoniy tarbiya asoslari", text: "Jismoniy tarbiya — bu insonning jismoniy salomatligini, chidamliligini va harakatchanligini rivojlantirish uchun amalga oshiriladigan mashqlar tizimi.\n\nSport — bu jismoniy tarbiyaning eng mashhur shakli. Futbol, basketbol, volleybol, tennis va boshqa sport turlari mavjud.\n\nMuntazam jismoniy mashqlar organizmni mustahkamlaydi, immunitetni oshiradi va kasalliklardan saqlaydi.\n\nHar kuni kamida 30 daqiqa jismoniy mashq qilish tavsiya etiladi." },
      { title: "2-Bob: Sport turlari", text: "Futbol — dunyodagi eng mashhur sport turi. 22 futbolchi maydonda o'ynaydi.\n\nBasketbol — 5 kishilik jamoada o'ynaladi. Yurish va sakrash qoidalari mavjud.\n\nVolleybol — 6 kishilik jamoada o'ynaladi. To'pni qo'l bilan urish kerak.\n\nYugurish — eng oddiy va foydali sport turi. Har qanday yoshda qilish mumkin." }
    ]
  },
  "book-5": {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    chapters: [
      { title: "Our Picture of the Universe", text: "A well-known scientist once gave a public lecture on astronomy. He described how the earth orbits around the sun and how the sun, in turn, orbits around the center of a vast collection of stars called our galaxy.\n\nAt the end of the lecture, a little old lady at the back of the room got up and said: What you have told us is rubbish. The world is really a flat plate supported on the back of a giant tortoise.\n\nThe scientist gave a superior smile before replying: What is the tortoise standing on? You're very clever, young man, very clever, said the old lady. But it's turtles all the way down!\n\nThe universe is expanding: galaxies are moving away from us at speeds proportional to their distance." },
      { title: "Space and Time", text: "The idea of an absolute position in space and time was central to Newton's theory. In this theory, an event could be assigned coordinates: three numbers specifying its position in space, and one number giving the time at which it occurred.\n\nBut this picture was overturned by Einstein's theory of relativity. There is no unique answer to the question of how time is passing.\n\nEinstein's theory also unified space and time into a single entity: spacetime. The speed of light is the same for all observers.\n\nThis simple postulate led to extraordinary consequences: time dilation, length contraction, and the equivalence of mass and energy (E=mc2)." },
      { title: "The Uncertainty Principle", text: "The Uncertainty Principle, formulated by Werner Heisenberg in 1927, states that there is a fundamental limit to the precision with which certain pairs of physical properties can be simultaneously known.\n\nIn other words, the more precisely you measure a particle's position, the less precisely you can know its momentum, and vice versa. This is not a limitation of our measuring instruments—it is a fundamental property of the universe.\n\nQuantum mechanics replaced classical physics at the microscopic level. Particles behave as both waves and particles (wave-particle duality)." }
    ]
  },
  "book-6": {
    title: "The Monk Who Sold His Ferrari",
    author: "Robin Sharma",
    chapters: [
      { title: "Chapter 1: The Story of the Monk", text: "Julian Mantle was a brilliant lawyer who had everything anyone could dream of: a gorgeous home, a reputation as a courtroom magician, a six-figure income, and a Porsche that was the envy of all his friends.\n\nBut Julian's frenzied pursuit of success came at a terrible price. His marriage was falling apart. He rarely saw his children. He was burning out from the inside. His health was deteriorating, and his life had lost all meaning.\n\nThen, in the middle of a trial, Julian had a massive heart attack. In that moment, staring at the ceiling of the courtroom, he realized that he had wasted his life. He decided to give up everything and go to India in search of true happiness." },
      { title: "Chapter 2: The Seven Virtues", text: "The first virtue is mastery over the mind. The monks taught Julian that our thoughts create our reality. If we can control our thoughts, we can control our life. The mind is like a garden—what you plant in it will grow.\n\nThe second virtue is to live with purpose. Without purpose, life is meaningless. The monks asked Julian: What would your life look like if you could do anything you wanted?\n\nThe third virtue is to live in the present. Most people spend their lives worrying about the future or regretting the past. The monks taught Julian to appreciate the beauty of each moment.\n\nThe fourth virtue is to practice selfless service. True happiness comes not from what we get, but from what we give." },
      { title: "Chapter 3: Finding Your Purpose", text: "Julian learned that everyone has a purpose in life, but most people never find it. The monks gave him a simple exercise: Write down what you would do if you had only six months to live.\n\nJulian's list surprised him. He didn't write about money, cars, or houses. He wrote about his children, his family, helping others, traveling, learning, and creating something meaningful.\n\nThe monks told him: Your purpose is already within you. You just need to clear away the noise of daily life to hear it.\n\nJulian returned to his old life a changed man. He sold his house, his car, and his expensive suits. He took his children to live in a small cottage by the sea. And for the first time in his life, he was truly happy." }
    ]
  },
  "book-7": {
    title: "How to Win Friends and Influence People",
    author: "Dale Carnegie",
    chapters: [
      { title: "Fundamental Techniques in Handling People", text: "Don't criticize, condemn, or complain. A barber lathers a man before he shaves him. Principle 1: Don't criticize, condemn, or complain.\n\nThe only way to get the best of an argument is to avoid it. If you argue and rankle and contradict, you may achieve a victory sometimes; but it will be an empty victory because you will never get your opponent's good will.\n\nA drop of honey catches more flies than a gallon of gall. When a man's temper rises, his reason departs.\n\nWhen dealing with people, let us remember we are not dealing with creatures of logic. We are dealing with creatures of emotion, creatures bristling with prejudices and motivated by pride and vanity." },
      { title: "Six Ways to Make People Like You", text: "Become genuinely interested in other people. A smile says, I like you. You make me happy. I am glad to see you.\n\nRemember that a person's name is to that person the sweetest and most important sound in any language. Be a good listener. Encourage others to talk about themselves.\n\nTalk in terms of other people's interests. Make the other person feel important—and do it sincerely.\n\nThe royal road to a person's heart is to talk about the things he or she treasures most." },
      { title: "How to Win People to Your Way of Thinking", text: "The only way to get the best of an argument is to avoid it. You can't win an argument. You can't because if you lose it, you lose it; and if you win it, you lose it.\n\nShow respect for the other person's opinion. Never say you're wrong. If you are wrong, admit it quickly and emphatically. Begin in a friendly way. Get the other person saying yes as soon as possible.\n\nLet the other person do a great deal of the talking. Let the other person feel that the idea is his or hers. Try honestly to see things from the other person's point of view." },
      { title: "Be a Leader: How to Change People", text: "Begin with praise and honest appreciation. It is always easier to hear unpleasant things after we have heard some praise of our good points. Call attention to people's mistakes indirectly.\n\nTalk about your own mistakes before criticizing the other person. Ask questions instead of giving direct orders. Let the other person save face. Praise every improvement, no matter how small.\n\nGive the other person a fine reputation to live up to. Use encouragement. Make the fault seem easy to do. Make the other person happy about doing the thing you suggest." }
    ]
  },
  "book-8": {
    title: "Word Power Made Easy",
    author: "Norman Lewis",
    chapters: [
      { title: "Part 1: Wordbuilding", text: "The first step in building your word power is understanding the roots of English words. Most English words come from Latin and Greek roots.\n\nWhen you know the roots of words, you can figure out the meaning of words you've never seen before. For example, the Latin root 'bene' means 'good' or 'well.' So when you see 'benefit,' 'benefactor,' or 'benevolent,' you know they all have something to do with 'good.'\n\nSimilarly, the Greek root 'phon' means 'sound.' So 'telephone' means 'far sound,' 'microphone' means 'small sound,' and 'symphony' means 'sounds together.'\n\nLearning just a few dozen roots can help you understand thousands of words." },
      { title: "Part 2: The Magic of Word Roots", text: "Here are some of the most useful word roots you can learn:\n\nVis or vid = to see: visible, vision, visual, visit, supervise, video\nAud = to hear: audience, audio, auditorium, audible\nDict = to say: dictionary, predict, contradict, dictate\nDuc or duct = to lead: conduct, produce, educate, introduce\nPort = to carry: transport, portable, export, import\nScript = to write: manuscript, prescribe, describe\nSpec = to look: inspect, spectacle, respect, suspect\nTract = to pull or draw: attract, extract, contract, distract\nVert = to turn: convert, divert, reverse, advertise\nVoc = to call: vocal, vocabulary, advocate, provoke" }
    ]
  },
  "book-9": {
    title: "The Art of War",
    author: "Sun Tzu",
    chapters: [
      { title: "Laying Plans", text: "Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.\n\nThe art of war, then, is governed by five constant factors, to be taken into account in one's deliberations, when seeking to determine the conditions obtaining in the field. These are: The Moral Law; Heaven; Earth; The Commander; Method and discipline.\n\nThe Moral Law causes the people to be in complete accord with their ruler, so that they will follow him regardless of their lives, undismayed by any danger.\n\nAll warfare is based on deception. Hence, when able to attack, we must seem unable; when using our forces, we must seem inactive." },
      { title: "Waging War", text: "In the practical art of war, the best thing of all is to take the enemy's country whole and intact; to shatter and destroy it is not so good. So, too, it is better to recruit an army than to destroy an army.\n\nWhere the army is, prices are high; when prices rise the wealth of the State is exhausted. When wealth is exhausted, the peasantry will be afflicted by heavy exactions. The stressed troops will lose heart, and the army will crumble.\n\nThus, though we have heard of stupid haste in war, cleverness has never been seen associated with long delays. There is no instance of a country having benefited from prolonged warfare." },
      { title: "Attack by Stratagem", text: "In the practical art of war, the best thing of all is to take the enemy's country whole and intact; to shatter and destroy it is not so good.\n\nSupreme excellence consists of breaking the enemy's resistance without fighting. Thus the highest form of generalship is to balk the enemy's plans; the next best is to prevent the junction of the enemy's forces; the next in order is to attack the enemy's army in the field; and the worst policy of all is to besiege walled cities.\n\nHence the skillful fighter puts himself into a position which makes defeat impossible, and does not miss the moment for defeating the enemy." }
    ]
  },
  "book-10": {
    title: "Matematika 7-sinf",
    author: "Mehmon Baxtiyorov",
    chapters: [
      { title: "1-Bob: Natural sonlar", text: "Natural sonlar — bu 0, 1, 2, 3, 4, ... dan iborat sonlar to'plamidir.\n\nSonlarni o'qish va yozish: 1000 = bir ming, 1000000 = bir million.\n\nQo'shish: ikki sonning yig'indisini topish.\n\nAyirish: ikki sonning farqini topish.\n\nKo'paytirish: bir nechta sonning ko'paytmasini topish.\n\nBo'lish: bir sonni ikkinchisiga bo'lish." },
      { title: "2-Bob: Kasr sonlar", text: "Kasr sonlar — bu bir butun sonning qismi. Masalan: 1/2, 3/4, 5/8.\n\nKasrlarni taqqoslash: bir xil maxrajli kasrlarni taqqoslash oson.\n\nKasrlarni qo'shish: bir xil maxrajli kasrlarni qo'shish.\n\nKasrlarni ayirish: bir xil maxrajli kasrlarni ayirish.\n\nKasrlarni ko'paytirish: suratlar ko'paytmasini maxrajlar ko'paytmasiga bo'lish." }
    ]
  },
  "book-11": {
    title: "Jannatda Ikki Boshli Qush",
    author: "Chingiz Aytmatov",
    chapters: [
      { title: "1-Bob: Qush hikoyasi", text: "Chingiz Aytmatovning Jannatda Ikki Boshli Qush asari qadimiy urf-odatlar va zamonaviy hayot o'rtasidagi ziddiyat haqida hikoya qiladi.\n\nAsar qahramonlari orqali muallif insoniyatning abadiy muammolarini — sevgi, sadoqat, vijdon va burch masalalarini ko'rib chiqadi.\n\nAytmatov o'z asarida Sharq va G'arb madaniyatini birlashtirgan. Uning yozuv mahorati butun dunyoda e'tirof etilgan.\n\nAsarda tabiat va inson o'zaro munosabati chuqur tasvirlangan." },
      { title: "2-Bob: Sevgi va sadoqat", text: "Asardagi sevgi hikoyasi juda chuqur va ta'sirchan. Qahramonlar o'z sevgilariga sadoqat bilan qaraydi.\n\nMuallif insonning yurakdagi his-tuyg'ularini juda nozik va badiiy tarzda tasvirlagan. Sevgi — bu inson hayotidagi eng qudratli kuch.\n\nSadoqat — bu sevgining eng yuqori shakli. Haqiqiy sevgi sinovlarni yengadi va abadiy qoladi.\n\nAytmatov o'z asari orqali o'quvchilarga haqiqiy qadriyatlarni — mehr-oqibat, sadoqat va insonparvarlikni singdiradi." }
    ]
  },
  "book-12": {
    title: "Dunyoning Ishlari",
    author: "O'tkir Hoshimov",
    chapters: [
      { title: "1-Bob: Dunyoning ishlari", text: "O'tkir Hoshimovning Dunyoning Ishlari romani o'zbek adabiyotining yorqin namunasi hisoblanadi.\n\nRoman zamonaviy O'zbekiston hayotini, odamlar munosabatlarini, ularning muvaffaqiyat va mag'lubiyatlarini aks ettiradi.\n\nAsarda turli qahramonlar taqdiri orqali jamiyatning umumiy manzarasi yaratilgan. Har bir qahramon o'ziga xos xususiyatlarga ega.\n\nHoshimovning yozuv uslubi juda sodda va tushunarli. Uning asarlari xalq orasida juda mashhur." },
      { title: "2-Bob: Hayot haqida", text: "Roman qahramonlari hayotning turli qirralarini — sevgi, do'stlik, oila, mehnat va orzu-husnlarini boshdan kechiradi.\n\nMuallif insonning hayotdagi o'rnini, uning maqsadini va boshqa odamlar bilan munosabatlarini chuqur tahlil qiladi.\n\nAsarda O'zbekiston tabiati, shahar va qishloqlari go'zal tasvirlangan. Bu asarga maxsus charm beradi.\n\nDunyoning Ishlari romanini o'qigan odam hayotga boshqacha qaraydi." }
    ]
  },
  "book-13": {
    title: "Fizika 8-sinf",
    author: "Mehmon Baxtiyorov",
    chapters: [
      { title: "1-Bob: Mexanika asoslari", text: "Fizika — tabiatning asosiy qonunlarini o'rganuvchi fan. 8-sinf darsligida mexanika asoslari chuqur o'rganiladi.\n\nHarakat — bu jismning vaqt o'tishi bilan o'z joyini o'zgartirishi.\n\nTezlik — bu yo'nalish va o'lchamga ega kattalik. Tezlik formula: v = s / t.\n\nAkseleratsiya — bu tezlikning o'zgarish tezligi. Akseleratsiya formula: a = (v - v0) / t." },
      { title: "2-Bob: Kuchlar", text: "Jismlarga ta'sir etuvchi kuchlar turlari mavjud:\n\n1. Tortishish kushi (gravitatsiya) — Yer jismlarni tortadi.\n2. Qo'llab-quvvatlash kushi — jismni ushlab turadi.\n3. Friksiya kuchi — harakatga qarshi.\n4. Elastik kuchi — cho'zilgan jismda.\n\nNeytonning harakat qonunlari fizikaning asosini tashkil etadi. Bu qonunlar har kuni hayotimizda qo'llaniladi." }
    ]
  },
  "book-14": {
    title: "Matematika 9-sinf",
    author: "Mehmon Baxtiyorov",
    chapters: [
      { title: "1-Bob: Sonlar tizimi", text: "9-sinf matematikasida sonlar tizimi chuqur o'rganiladi.\n\nNatural sonlar, butun sonlar, ratsional va irratsional sonlar.\n\nKvadrat ildiz va darajalar: root(a), a^n, (a^n)^m = a^(n*m).\n\nHadlar yig'indisi: a + b, (a + b)^2 = a^2 + 2ab + b^2.\n\nKo'paytma: (a + b)(a - b) = a^2 - b^2.\n\nThese formulas are fundamental for algebra and higher mathematics." },
      { title: "2-Bob: Hadlar va tenglamalar", text: "Tenglamalar — bu noma'lum son topish uchun ishlatiladigan matematik ifodalar.\n\nBirinchi darajali tenglamalar: ax + b = 0, yechimi: x = -b/a.\n\nIkkinchi darajali tenglamalar: ax^2 + bx + c = 0.\n\nDiskriminant: D = b^2 - 4ac. Agar D > 0 — ikki yechim, D = 0 — bir yechim, D < 0 — yechim yo'q.\n\nTenglamalar sistemasini yechish usullari:代入 va ekvivalent o'zgartirish." }
    ]
  },
  "book-15": {
    title: "Ingliz tili 5-sinf",
    author: "Mehmon Baxtiyorov",
    chapters: [
      { title: "Unit 1: Greetings", text: "Hello! My name is... What is your name?\nNice to meet you! How are you? I'm fine, thank you. And you?\n\nGood morning! Good afternoon! Good evening! Goodbye!\n\nThis is my teacher. This is my friend. Welcome to our school!\n\nLet's learn some basic English phrases for everyday use. Practice makes perfect!" },
      { title: "Unit 2: Numbers and Colors", text: "One, two, three, four, five, six, seven, eight, nine, ten.\nEleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty.\n\nRed, blue, green, yellow, orange, purple, pink, brown, black, white.\n\nWhat color is this? It's red. How many books do you have? I have five books.\n\nLet's count together! 1, 2, 3, 4, 5, 6, 7, 8, 9, 10. Very good!" }
    ]
  },
  "book-16": {
    title: "Deep Work",
    author: "Cal Newport",
    chapters: [
      { title: "Introduction: Deep Work", text: "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time.\n\nDeep work will make you better at what you do and provide the sense of true fulfillment that comes from craftsmanship. In short, deep work is like a super power in our increasingly competitive twenty-first century economy.\n\nThe ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable in our economy. As a consequence, the few who cultivate this skill, and then make it the core of their working life, will thrive." },
      { title: "Chapter 1: The Idea of Deep Work", text: "Deep work is professional activities performed in a state of distraction-free concentration that push your cognitive capabilities to their limit. These efforts create new value, improve your skill, and are hard to replicate.\n\nShallow work is non-cognitively demanding, logistical-style work, often performed while distracted. These efforts tend not to create much new value in the world and are easy to replicate.\n\nMost people don't have deep work because they haven't cultivated a deep work habit. They are constantly distracted by email, social media, and other digital interruptions.\n\nNewport proposes that deep work is not just a nice-to-have skill—it's essential for success in the modern economy." }
    ]
  },
  "book-17": {
    title: "O'zbekiston Tarixi",
    author: "Mehmon Baxtiyorov",
    chapters: [
      { title: "1-Bob: O'zbekistonning qadimiy tarixi", text: "O'zbekiston — Markaziy Osiyodagi davlat. Uning boy tarixi ming yillar oldin boshlangan.\n\nQadimiy O'zbekiston hududida ko'plab sivilizatsiyalar rivojlangan. Buyuk Ipak Yo'li shu yerdan o'tgan.\n\nSamarqand, Buxoro, Xiva — bu shaharlar butun dunyoda mashhur. Ular fan, madaniyat va savdo markazi bo'lgan.\n\nAmir Temur — buyuk sarkarda va davlat arbobi. Uning davrida O'zbekiston kuch-qudratning cho'qqisiga chiqqan." },
      { title: "2-Bob: Mustaqillik", text: "1991-yil 31-avgustda O'zbekiston mustaqilligini e'lon qildi.\n\nMustaqillik yillarida O'zbekiston katta o'zgarishlarni boshdan kechirdi. Yangi konstitutsiya qabul qilindi.\n\nTa'lim, sog'liqni saqlash, iqtisodiyot sohalarida katta ishlar amalga oshirildi.\n\nO'zbekiston xalqaro hamjamiyatda o'z o'rnini topdi. Mamlakat taraqqiyot yo'nalishida ketmoqda." }
    ]
  },
  "book-18": {
    title: "Think and Grow Rich",
    author: "Napoleon Hill",
    chapters: [
      { title: "Chapter 1: Thoughts Are Things", text: "Napoleon Hill spent more than twenty years in research with the most successful people of his time. The result was a simple formula for success that anyone could follow.\n\nThe starting point of all achievement is DESIRE. Keep this constantly in mind. Weak desire brings weak results, just as a small fire makes a small amount of heat.\n\nWhatever the mind can conceive and believe, it can achieve. This is not a fairy tale. It has been proven beyond doubt by thousands of men and women who have applied this principle.\n\nThe first step is to fix in your mind the exact amount of money you desire." },
      { title: "Chapter 2: The Secret of Achievement", text: "There are six steps to transmuting your desire into money. First: Fix in your mind the exact amount of money you desire. Second: Determine what you intend to give in return for the money.\n\nThird: Establish a definite date when you intend to possess the money. Fourth: Create a definite plan for carrying out your desire and begin at once, whether you are ready or not.\n\nFifth: Write out a clear, concise statement of the amount of money you intend to acquire, name the time limit for its acquisition, state what you intend to give in return, and describe the plan through which you intend to accumulate it.\n\nSixth: Read your written statement aloud, twice daily." },
      { title: "Chapter 3: Faith", text: "Faith is the visualization of and belief in the attainment of desire. Faith is the head chemist of the mind. When faith is blended with the vibration of thought, the subconscious mind instantly picks up the vibration, translates it into its spiritual equivalent, and transmits it to Infinite Intelligence.\n\nFaith is a state of mind which may be induced, or created, by repeated instruction to the subconscious mind, through the principle of auto-suggestion.\n\nAll thoughts which have been emotionalized (mixed with feeling) and blended with faith, begin immediately to translate themselves into their physical equivalent.\n\nThe emotions are the activating energy of thought." }
    ]
  },
  "book-19": {
    title: "Rus tili 6-sinf",
    author: "Mehmon Baxtiyorov",
    chapters: [
      { title: "1-Bob: Alifbo", text: "Russkiy alfavit sostoit iz 33 bukv.\n\nA, B, V, G, D, E, Yo, Zh, Z, I, Y, K, L, M, N, O, P, R, S, T, U, F, Kh, Ts, Ch, Sh, Shch, Yy, Y, Y, E, Yu, Ya.\n\nGlanye bukvy: A, O, U, Yy, E, Ye, Yo, Yu, Ya.\n\nSoglasnyye bukvy: B, V, G, D, Zh, Z, K, L, M, N, P, R, S, T, F, Kh, Ts, Ch, Sh, Shch.\n\nDavayte uchit russkiy alfavit!" },
      { title: "2-Bob: Salomlashish", text: "Zdravstvuyte! Kak vas zovut?\nMenya zovut... A vas?\n\nDobroye utro! Dobryy den! Dobryy vecher! Do svidaniya!\n\nKak dela? Khorosho, spasibo! A u vas?\n\nPozhaluysta! Spasibo! Izvinite!\n\nDavayte uchit russkiy yazyk vmeste!" }
    ]
  },
  "book-20": {
    title: "Biologiya 7-sinf",
    author: "Mehmon Baxtiyorov",
    chapters: [
      { title: "1-Bob: Hayot dunyosi", text: "Biologiya — tirik organizmlarni o'rganuvchi fan.\n\nHujayra — tirik organizmning asosiy birligi. Hujayra tarkibi: yadro, sitoplazma, hujayra devori.\n\nO'simliklar hujayrasi va hayvonlar hujayrasi farqlari.\n\nFotosintez — o'simliklarning yorug'lik energiyasini kimyoviy energiyaga aylantirishi jarayoni.\n\n6CO2 + 6H2O + yorug'lik = C6H12O6 + 6O2" },
      { title: "2-Bob: Genetika", text: "Genetika — nasl-navlarning xususiyatlarini o'rganuvchi fan.\n\nDNK — deoksiribonuklein kislota. U genetik axborotni saqlaydi.\n\nGenlar — naslga o'tkaziluvchi belgilar. Har bir gen ma'lum bir oqsilni kodlaydi.\n\nMendel qonunlari: mustaqillik qonuni va ajralish qonuni.\n\nDominant va retsessiv genlar. Genotip va fenotip tushunchalari." }
    ]
  }
};

function escapePDFString(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function generateBookPDF(bookId) {
  const book = BOOK_CONTENT[bookId];
  if (!book) return null;

  const pages = [];
  const linesPerPage = 40;
  const margin = 72;

  // Title page content
  pages.push([
    `BT`,
    `/F1 28 Tf`,
    `${margin} 600 Td`,
    `(${escapePDFString(book.title)}) Tj`,
    `/F1 18 Tf`,
    `0 -40 Td`,
    `(${escapePDFString('by ' + book.author)}) Tj`,
    `0 -80 Td`,
    `/F1 14 Tf`,
    `(MBSI Library) Tj`,
    `0 -30 Td`,
    `(Digital Collection) Tj`,
    `ET`,
  ]);

  // Chapter pages
  for (const chapter of book.chapters) {
    // Chapter title
    const titleLines = [`BT`, `/F1 16 Tf`, `${margin} 720 Td`, `(${escapePDFString(chapter.title)}) Tj`, `ET`];
    pages.push(titleLines);

    // Chapter text
    const words = chapter.text.split(' ');
    let currentLine = '';
    const textLines = [];

    for (const word of words) {
      if ((currentLine + ' ' + word).length > 75) {
        if (currentLine) textLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }
    if (currentLine) textLines.push(currentLine);

    // Paginate text lines
    let pageContent = [];
    for (const line of textLines) {
      pageContent.push(line);
      if (pageContent.length >= linesPerPage) {
        const streamContent = `BT\n/F1 12 Tf\n`;
        let y = 700;
        const lines = pageContent.map(l => `${margin} ${y-- * 14} Td\n(${escapePDFString(l)}) Tj`).join('\n');
        pages.push([streamContent + lines + '\nET']);
        pageContent = [];
      }
    }
    if (pageContent.length > 0) {
      let y = 700;
      const lines = pageContent.map(l => `${margin} ${y-- * 14} Td\n(${escapePDFString(l)}) Tj`).join('\n');
      pages.push([`BT\n/F1 12 Tf\n${lines}\nET`]);
    }
  }

  // Build PDF
  const objects = [];
  let pdf = '%PDF-1.4\n';

  // Catalog
  objects.push({ type: 'catalog', content: '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' });

  // Pages object
  const pageRefs = pages.map((_, i) => `${i + 3} 0 R`).join(' ');
  objects.push({ type: 'pages', content: `2 0 obj\n<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>\endobj\n` });

  // Page objects
  for (let i = 0; i < pages.length; i++) {
    objects.push({
      type: 'page',
      content: `${i + 3} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${pages.length + 3} 0 R /Resources << /Font << /F1 ${pages.length + 4} 0 R >> >> >>\nendobj\n`
    });
  }

  // Content stream
  let streamContent = '';
  for (const pageLines of pages) {
    streamContent += pageLines.join('\n') + '\n';
  }

  // Write all objects with offsets
  const offsets = [];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj.content;
  }

  // Content stream object
  offsets.push(pdf.length);
  pdf += `${pages.length + 3} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream\nendobj\n`;

  // Font object
  offsets.push(pdf.length);
  pdf += `${pages.length + 4} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  // Cross-reference table
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${pages.length + 5}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
  }

  // Trailer
  pdf += `trailer\n<< /Size ${pages.length + 5} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

async function main() {
  console.log("📚 Generating PDF books for MBSI Library\n");

  await mkdir(PDF_DIR, { recursive: true });

  let count = 0;
  for (const bookId of Object.keys(BOOK_CONTENT)) {
    const filePath = join(PDF_DIR, bookId + '.pdf');
    const book = BOOK_CONTENT[bookId];

    console.log(`📄 Generating: ${book.title}`);
    const pdf = generateBookPDF(bookId);

    if (pdf) {
      const ws = createWriteStream(filePath);
      ws.write(pdf);
      ws.end();
      console.log(`   ✅ Created: ${bookId}.pdf (${(pdf.length / 1024).toFixed(1)} KB)`);
      count++;
    } else {
      console.log(`   ⚠️  No content for ${bookId}`);
    }
  }

  console.log(`\n🎉 Generated ${count} books!`);
}

main().catch(console.error);
