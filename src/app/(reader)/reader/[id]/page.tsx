import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth";
import { getBookBySlug } from "@/lib/server/books";
import { getProgress } from "@/lib/server/reading";
import { signPdfAccess } from "@/lib/server/storage";
import { Reader } from "@/components/reader";

export default async function ReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await getSessionUser();
  if (!user) return null;

  const book = await getBookBySlug(id);
  if (!book) notFound();
  // Yashirilgan/qoralama kitoblarni o'qish faqat ADMIN va BOOK_MANAGER uchun
  const canSeeHidden =
    user.role === "ADMIN" || user.role === "BOOK_MANAGER";
  const isHiddenOrDraft =
    !book.isPublished ||
    (book.status === "HIDDEN" || book.status === "DRAFT");
  if (!canSeeHidden && isHiddenOrDraft) notFound();

  // O'qish SAQLangan joyidan davom ettiriladi: ?page=N (deep link) ustunlik
  // qiladi, aks holda oxirgi ko'rilgan sahifa. Yangi kitob 1-sahifadan boshlanadi.
  const saved = await getProgress(user.id, book.id);
  const maxPage = Math.max(1, book.totalPages || 1);
  const savedPage = Math.min(Math.max(saved?.currentPage ?? 1, 1), maxPage);
  const initialPage = sp.page
    ? Math.min(Math.max(1, Number(sp.page) || 1), maxPage)
    : savedPage;
  const pdfUrl = signPdfAccess(book.id, 7200);

  return (
    <Reader
      bookId={book.id}
      title={book.title}
      totalPages={book.totalPages}
      pdfUrl={pdfUrl}
      initialPage={initialPage}
    />
  );
}
