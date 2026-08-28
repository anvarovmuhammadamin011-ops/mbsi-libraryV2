import { prisma } from "@/lib/db";
import { ApiError, ERROR_CODES } from "./errors";

export type ReviewWithUser = {
  id: string;
  userId: string;
  bookId: string;
  rating: number;
  text: string;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; avatar: string | null };
};

export async function listReviews(bookId: string, includeHidden = false) {
  return prisma.review.findMany({
    where: { bookId, ...(includeHidden ? {} : { isHidden: false }) },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function upsertReview(userId: string, bookId: string, rating: number, text: string) {
  if (rating < 1 || rating > 5) throw new ApiError(ERROR_CODES.VALIDATION, "Rating 1-5 bo'lishi kerak", 400);
  if (!text.trim() || text.trim().length < 3) throw new ApiError(ERROR_CODES.VALIDATION, "Sharh juda qisqa", 400);
  if (text.length > 2000) throw new ApiError(ERROR_CODES.VALIDATION, "Sharh juda uzun", 400);

  // Only allow rating/review if user has started reading
  const progress = await prisma.readingProgress.findUnique({
    where: { userId_bookId: { userId, bookId } },
  });
  if (!progress) throw new ApiError(ERROR_CODES.FORBIDDEN, "Avval kitobni o'qishni boshlang", 403);

  const review = await prisma.review.upsert({
    where: { userId_bookId: { userId, bookId } },
    create: { userId, bookId, rating, text: text.trim() },
    update: { rating, text: text.trim(), isHidden: false },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  // Also keep Rating table in sync for average calculation
  await prisma.rating.upsert({
    where: { userId_bookId: { userId, bookId } },
    create: { userId, bookId, rating },
    update: { rating },
  });

  return review;
}

export async function deleteReview(userId: string, bookId: string) {
  await prisma.review.deleteMany({ where: { userId, bookId } });
}

export async function deleteReviewById(id: string) {
  await prisma.review.delete({ where: { id } });
}

export async function toggleHideReview(id: string, isHidden: boolean) {
  return prisma.review.update({ where: { id }, data: { isHidden } });
}

export async function listAllReviewsForAdmin() {
  return prisma.review.findMany({
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      book: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
