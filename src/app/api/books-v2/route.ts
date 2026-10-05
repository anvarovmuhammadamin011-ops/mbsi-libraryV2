import { route } from "@/lib/server/handler";
import { handleBookList, handleBookCreate } from "@/lib/server/books-api";

// Yangi kitoblar API'si.
export const GET = route(handleBookList);
export const POST = route(handleBookCreate);
