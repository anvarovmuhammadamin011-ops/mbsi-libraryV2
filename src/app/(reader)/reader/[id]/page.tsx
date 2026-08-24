import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth";
import { getBookBySlug } from "@/lib/server/books";
import { prisma } from "@/lib/db";
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

  const progress = await prisma.readingProgress.findUnique({
    where: { userId_bookId: { userId: user.id, bookId: book.id } },
  });
  const initialPage = sp.page ? Number(sp.page) : progress?.currentPage ?? 1;
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
