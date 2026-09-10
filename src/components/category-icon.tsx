import { createElement } from "react";
import {
  Atom,
  BookMarked,
  BookOpen,
  Brain,
  Briefcase,
  ChefHat,
  Cpu,
  Feather,
  FlaskConical,
  GraduationCap,
  Landmark,
  Languages,
  Lightbulb,
  Monitor,
  Music,
  Palette,
  Plane,
  Scale,
  Sigma,
  Sprout,
  Stethoscope,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";

// ─── Category icon map ───────────────────────────────────────
// Replaces the emoji icons previously stored on categories with
// professional lucide icons, keyed by slug first, then by name.
// Matching is case-insensitive and also checks substrings so
// custom categories still get a sensible icon.
const ICON_BY_SLUG: Record<string, LucideIcon> = {
  it: Monitor,
  informatika: Monitor,
  fiction: BookOpen,
  "badiiy-adabiyot": BookOpen,
  science: FlaskConical,
  "ommabop-ilm-fan": FlaskConical,
  history: Landmark,
  tarix: Landmark,
  psychology: Brain,
  psixologiya: Brain,
  business: Briefcase,
  biznes: Briefcase,
  education: GraduationCap,
  technology: Cpu,
  literature: Feather,
  "ozbek-adabiyoti": Feather,
  philosophy: Lightbulb,
  falsafa: Lightbulb,
  art: Palette,
  religion: BookMarked,
  economy: TrendingUp,
  law: Scale,
  medicine: Stethoscope,
  sports: Trophy,
  music: Music,
  travel: Plane,
  cooking: ChefHat,
  matematika: Sigma,
  fizika: Atom,
  "ingliz-tili": Languages,
  "shaxsiy-rivojlanish": Sprout,
};

const ICON_BY_NAME: [string, LucideIcon][] = [
  ["badiiy", BookOpen],
  ["adabiyot", Feather],
  ["ilm-fan", FlaskConical],
  ["ilmiy", FlaskConical],
  ["tarix", Landmark],
  ["psixolog", Brain],
  ["biznes", Briefcase],
  ["ta'lim", GraduationCap],
  ["texnolog", Cpu],
  ["falsafa", Lightbulb],
  ["matematika", Sigma],
  ["fizika", Atom],
  ["ingliz", Languages],
  ["rivojlanish", Sprout],
  ["moliy", TrendingUp],
  ["sport", Trophy],
  ["musiqa", Music],
  ["san'at", Palette],
];

export function categoryIcon(
  slug: string,
  name: string
): LucideIcon {
  const bySlug = ICON_BY_SLUG[slug.toLowerCase()];
  if (bySlug) return bySlug;
  const lower = name.toLowerCase();
  for (const [key, icon] of ICON_BY_NAME) {
    if (lower.includes(key)) return icon;
  }
  return BookOpen;
}

export function CategoryIcon({
  slug,
  name,
  size = 18,
  className,
}: {
  slug: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = categoryIcon(slug, name);
  return createElement(Icon, { size, className, "aria-hidden": true });
}