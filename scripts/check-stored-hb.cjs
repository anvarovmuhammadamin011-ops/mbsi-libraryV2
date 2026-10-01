const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const rows = await p.storedFile.findMany({
    where: { key: { startsWith: "pdfs/hb-" } },
    select: { key: true, size: true },
  });
  console.log("hb stored rows:", rows.length);
  let tot = 0;
  for (const r of rows) {
    tot += r.size;
    console.log(r.key, r.size);
  }
  console.log("total MB:", Math.round(tot / 1024 / 1024));
  await p.$disconnect();
})();