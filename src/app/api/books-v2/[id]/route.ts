import { route } from "@/lib/server/handler";
import {
  handleBookGet,
  handleBookPatch,
  handleBookDelete,
} from "@/lib/server/books-api";

export const GET = route(handleBookGet);
export const PATCH = route(handleBookPatch);
export const DELETE = route(handleBookDelete);
