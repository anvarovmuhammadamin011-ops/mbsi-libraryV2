/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
(async () => {
  const p = new PrismaClient();
  console.log("ratings:", await p.rating.count());
  await p.$disconnect();
})();
