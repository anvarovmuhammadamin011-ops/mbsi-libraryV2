/**
 * Deterministic pastel gradients per category.
 * Soft tones keep text readable in both light and dark mode,
 * and the hash keeps each category's color stable across reloads.
 */

interface CategoryColor {
  /** gradient background classes */
  bg: string;
  /** matching text color classes */
  text: string;
}

const PALETTE: CategoryColor[] = [
  { bg: "from-blue-100 to-indigo-100 dark:from-blue-950/70 dark:to-indigo-950/70", text: "text-blue-700 dark:text-blue-300" },
  { bg: "from-emerald-100 to-teal-100 dark:from-emerald-950/70 dark:to-teal-950/70", text: "text-emerald-700 dark:text-emerald-300" },
  { bg: "from-amber-100 to-orange-100 dark:from-amber-950/70 dark:to-orange-950/70", text: "text-amber-700 dark:text-amber-300" },
  { bg: "from-rose-100 to-pink-100 dark:from-rose-950/70 dark:to-pink-950/70", text: "text-rose-700 dark:text-rose-300" },
  { bg: "from-violet-100 to-purple-100 dark:from-violet-950/70 dark:to-purple-950/70", text: "text-violet-700 dark:text-violet-300" },
  { bg: "from-cyan-100 to-sky-100 dark:from-cyan-950/70 dark:to-sky-950/70", text: "text-cyan-700 dark:text-cyan-300" },
  { bg: "from-lime-100 to-green-100 dark:from-lime-950/70 dark:to-green-950/70", text: "text-lime-700 dark:text-lime-300" },
  { bg: "from-fuchsia-100 to-pink-100 dark:from-fuchsia-950/70 dark:to-pink-950/70", text: "text-fuchsia-700 dark:text-fuchsia-300" },
];

export function getCategoryColor(key: string): CategoryColor {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}
