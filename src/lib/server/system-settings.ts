import { prisma } from "@/lib/db";
import type { SystemSettings } from "@/types";
import type { Prisma } from "@prisma/client";

const SETTINGS_KEY = "app";

export const DEFAULT_SETTINGS: SystemSettings = {
  // Faollik hisoblash: "haqiqiy o'qish" deb hisoblash uchun minimal mezonlar.
  // Shaklangan sahifalar/davomiylik shu chegaradan past bo'lsa session
  // battle ochkolariga hisoblanmaydi — kitobni ochib qo'yish orqali aldashni oldini oladi.
  minPagesPerRead: 5,
  minSecondsPerRead: 120,
  // Battle ochko qoidalari (kitob menejeri dashboardidan alohida, faqat admin).
  battleStartPoints: 2,
  battleProgressPoints: 5,
  battleCompletePoints: 10,
  // Xodim (STAFF) oddiy ilovaga kira oladimi.
  staffCanAccessApp: true,
  maxActiveBooks: 3,
};

export const SETTINGS_KEYS: (keyof SystemSettings)[] = [
  "minPagesPerRead",
  "minSecondsPerRead",
  "battleStartPoints",
  "battleProgressPoints",
  "battleCompletePoints",
  "staffCanAccessApp",
  "maxActiveBooks",
];

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });
    const stored = (row?.value ?? {}) as Record<string, unknown>;
    return sanitize(stored);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function updateSystemSettings(
  patch: Partial<SystemSettings>
): Promise<SystemSettings> {
  const current = await getSystemSettings();
  const next: Record<string, unknown> = { ...current, ...patch };
  await prisma.systemSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: next as Prisma.InputJsonValue },
    update: { value: next as Prisma.InputJsonValue },
  });
  return sanitize(next);
}

function sanitize(raw: Record<string, unknown>): SystemSettings {
  const out: SystemSettings = { ...DEFAULT_SETTINGS };
  for (const key of Object.keys(out) as (keyof SystemSettings)[]) {
    const v = raw[key];
    if (key === "staffCanAccessApp" && typeof v === "boolean") {
      (out as unknown as Record<string, unknown>)[key] = v;
      continue;
    }
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      (out as unknown as Record<string, unknown>)[key] = v;
    }
  }
  return out;
}