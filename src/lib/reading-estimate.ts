// Kitobni tugatish vaqtini sahifalar sonidan hisoblash.
// Bu modul server (Prisma) import qilmaydi — klient komponentlarida ham
// xavfsiz ishlatiladi.

/** O'rtacha o'qish tezligi: ~1 bet = 72 soniya (1.2 daqiqa). */
export const SECONDS_PER_PAGE = 72;

/** Sahifalar sonidan taxminiy o'qish vaqti (daqiqa). */
export function estimateReadingMinutes(totalPages: number): number {
  if (!totalPages || totalPages <= 0) return 0;
  return Math.max(1, Math.round((totalPages * SECONDS_PER_PAGE) / 60));
}

/** "5 soat 20 daq" ko'rinishidagi matn. */
export function formatReadingEstimate(totalPages: number): string {
  const minutes = estimateReadingMinutes(totalPages);
  if (minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h} soat${m > 0 ? ` ${m} daq` : ""}`;
  return `${m} daq`;
}
