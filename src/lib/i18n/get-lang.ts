import { cookies } from "next/headers";
import { LANG_COOKIE, normalizeLang, type Lang } from "./dictionaries";

/** Server-side: current UI language from cookie (defaults to "uz"). */
export async function getLang(): Promise<Lang> {
  try {
    const store = await cookies();
    return normalizeLang(store.get(LANG_COOKIE)?.value);
  } catch {
    return "uz";
  }
}
