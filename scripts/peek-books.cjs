/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const DIR = "C:\\Users\\Victus\\Desktop\\books";
const FILES = [
  "Qiz-bolaga-tosh-otmang.pdf",
  "Mirach-Chagriy-Oqtosh-Tosiqlarga-qaramay-sevdik.pdf",
  "Muhammad-Yusuf-Xalq-bol-Elim.pdf",
  "%40KutubxonaaN1Jorj-Oruell-Molxona.pdf",
  "Kaykovus-Qobusnoma.pdf",
  "Shuhrat-Oltin-zanglamas.pdf",
];

(async () => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  for (const f of FILES) {
    try {
      const buf = fs.readFileSync(path.join(DIR, f));
      const doc = await pdfjs.getDocument({
        data: new Uint8Array(buf),
        isEvalSupported: false,
        useSystemFonts: false,
      }).promise;
      let text = "";
      for (let p = 1; p <= Math.min(2, doc.numPages); p++) {
        const page = await doc.getPage(p);
        const tc = await page.getTextContent();
        text += tc.items.map((i) => i.str).join(" ") + "\n";
      }
      await doc.destroy();
      console.log("=====", f, "pages:", doc.numPages);
      console.log(text.slice(0, 600).replace(/\s+/g, " "));
      console.log();
    } catch (e) {
      console.log("FAIL", f, e.message);
    }
  }
})();
