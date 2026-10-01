import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const dir = path.join(process.cwd(), "storage/private/pdfs");
let count=0;
for(let i=71;i<=120;i++){
  const file = `book-${i}.pdf`;
  const p = path.join(dir, file);
  if(!fs.existsSync(p)){ console.log(`skip ${file} not found`); continue; }
  const key = `pdfs/${file}`;
  const data = fs.readFileSync(p);
  const existing = await prisma.storedFile.findUnique({where:{key}});
  if(existing){ console.log(`skip ${key} exists`); continue; }
  await prisma.storedFile.create({data:{key, mime:"application/pdf", size:data.length, data:new Uint8Array(data)}});
  console.log(`migrated ${key} ${Math.round(data.length/1024)}KB`);
  count++;
}
console.log(`Done ${count}`);
await prisma.$disconnect();
