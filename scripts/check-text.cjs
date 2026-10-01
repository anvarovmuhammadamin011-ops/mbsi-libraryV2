const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const books = await p.book.findMany({
    select: {
      id: true,
      title: true,
      content: { select: { status: true, extractedText: true } },
    },
  });
  console.log("books:", books.length);
  let withText = 0;
  for (const b of books) {
    const c = b.content;
    const has = c && c.extractedText && c.extractedText.length > 0;
    if (has) withText++;
    console.log(
      `${b.id} | ${b.title} | status=${c?.status ?? "NO_CONTENT"} | textLen=${has ? c.extractedText.length : 0}`
    );
  }
  console.log("with text:", withText);
  await p.$disconnect();
})();