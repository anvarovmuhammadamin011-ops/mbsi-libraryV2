import { route } from "@/lib/server/handler";
import { handleBookSync } from "@/lib/server/books-api";

// Eski /api/books'dagi kitoblarni yangi API bazasiga moslashtirish.
export const POST = route(handleBookSync);
