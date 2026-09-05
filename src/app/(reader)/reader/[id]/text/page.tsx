import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth";
import { getBookBySlug } from "@/lib/server/books";
import { TextReader } from "@/components/text-reader";
import { signPdfAccess } from "@/lib/server/storage";

export default async function TextReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return null;

  const book = await getBookBySlug(id);
  if (!book) notFound();

  const pdfUrl = book.pdfUrl ? signPdfAccess(book.id, 7200) : undefined;

  return (
    <TextReader
      bookId={book.id}
      title={book.title}
      totalPages={book.totalPages}
      pdfUrl={pdfUrl}
    />
  );
}
