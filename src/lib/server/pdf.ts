import { ApiError, ERROR_CODES } from "./errors";

const MAX_PDF_BYTES = 60 * 1024 * 1024; // 60MB
const MAX_COVER_BYTES = 8 * 1024 * 1024; // 8MB

export function validatePdf(
  buffer: Buffer,
  mimetype: string,
  filename: string
): void {
  const ext = filename.toLowerCase().endsWith(".pdf");
  const mime = mimetype === "application/pdf";
  const header = buffer.slice(0, 5).toString("latin1") === "%PDF-";
  if (!ext || !mime || !header) {
    throw new ApiError(
      ERROR_CODES.INVALID_FILE,
      "Faqat PDF fayl yuklash mumkin",
      400
    );
  }
  if (buffer.length > MAX_PDF_BYTES) {
    throw new ApiError(
      ERROR_CODES.INVALID_FILE,
      "PDF hajmi 60MB dan oshmasligi kerak",
      400
    );
  }
}

const COVER_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export function validateCover(
  buffer: Buffer,
  mimetype: string,
  filename: string
): void {
  const ext = /\.(jpe?g|png|webp|gif|svg)$/i.test(filename);
  if (!ext || !COVER_MIMES.includes(mimetype)) {
    throw new ApiError(
      ERROR_CODES.INVALID_FILE,
      "Faqat rasm fayl yuklash mumkin (JPG, PNG, WEBP, GIF, SVG)",
      400
    );
  }
  if (buffer.length > MAX_COVER_BYTES) {
    throw new ApiError(
      ERROR_CODES.INVALID_FILE,
      "Rasm hajmi 8MB dan oshmasligi kerak",
      400
    );
  }
}

// Count pages using the PDF page-tree objects. This avoids any
// native dependency and works for the vast majority of PDFs.
export function countPdfPages(buffer: Buffer): number {
  const text = buffer.toString("latin1");
  const matches = text.match(/\/Type\s*\/\s*Page(?!s)/g);
  const count = matches ? matches.length : 0;
  return count > 0 ? count : 1;
}
