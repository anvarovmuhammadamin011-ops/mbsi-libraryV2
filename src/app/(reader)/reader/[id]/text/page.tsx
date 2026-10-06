import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth";
import { getBookBySlug } from "@/lib/server/books";
import { getProgress } from "@/lib/server/reading";
import { TextReader } from "@/components/text-reader";
import { signPdfAccess } from "@/lib/server/storage";

export default async function TextReaderPage({
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

  const pdfUrl = book.pdfUrl ? signPdfAccess(book.id, 7200) : undefined;

  // Saqlangan o'qish joyidan davom ettirish (?page=N ustunlik qiladi).
  const saved = await getProgress(user.id, book.id);
  const maxPage = Math.max(1, book.totalPages || 1);
  const initialPage = sp.page
    ? Math.min(Math.max(1, Number(sp.page) || 1), maxPage)
    : Math.min(Math.max(saved?.currentPage ?? 1, 1), maxPage);

  return (
    <TextReader
      bookId={book.id}
      title={book.title}
      totalPages={book.totalPages}
      pdfUrl={pdfUrl}
      slug={book.slug}
      initialPage={initialPage}
    />
  );
}
