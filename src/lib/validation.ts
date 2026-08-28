import { z } from "zod";

export const MAX_ACTIVE_BOOKS = 3;

export const loginSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]),
});

export const bookCreateSchema = z.object({
  title: z.string().min(2, "Sarlavha juda qisqa").max(200),
  description: z.string().max(5000).optional().default(""),
  authorId: z.string().min(1, "Muallif tanlang"),
  categoryId: z.string().min(1, "Kategoriya tanlang"),
  language: z.enum(["UZ", "RU", "EN"]),
  isPublished: z.boolean().optional().default(false),
  coinReward: z.coerce.number().int().min(0).max(1000).optional().default(10),
});

export const bookUpdateSchema = bookCreateSchema
  .partial()
  .extend({
    coverChanged: z.boolean().optional(),
    pdfChanged: z.boolean().optional(),
  });

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export const reviewSchema = z.object({
  bookId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  text: z.string().min(3, "Sharh juda qisqa").max(2000, "Sharh juda uzun"),
});

export const bookmarkSchema = z.object({
  page: z.number().int().min(1),
  note: z.string().max(1000).optional(),
});

export const progressSchema = z.object({
  page: z.number().int().min(0),
});

export const sessionStartSchema = z.object({
  startPage: z.number().int().min(1),
});

export const sessionEndSchema = z.object({
  endPage: z.number().int().min(0),
});

export const userUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"]).optional(),
});

export const authorSchema = z.object({
  name: z.string().min(2).max(200),
  biography: z.string().max(5000).optional(),
  avatar: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(2000).optional(),
  icon: z.string().max(20).optional(),
});

export const bannerSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().optional(),
  link: z.string().optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const recommendationSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  bookId: z.string().min(1),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const bookQuerySchema = z.object({
  q: z.string().optional(),
  language: z.enum(["UZ", "RU", "EN"]).optional(),
  categoryId: z.string().optional(),
  authorId: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  sort: z
    .enum(["newest", "rating", "popular", "pages"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
  publishedOnly: z.boolean().optional().default(true),
});

export type BookQuery = z.infer<typeof bookQuerySchema>;
