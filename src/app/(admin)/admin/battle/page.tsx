import { requireRole } from "@/lib/server/auth";
import { getBattleData, formatReadable } from "@/lib/server/battle";
import { getSystemSettings } from "@/lib/server/system-settings";
import type { ReactNode } from "react";
import {
  Swords,
  Trophy,
  Award,
  BookOpen,
  BookCheck,
  Users2,
  Flame,
  Clock,
  Shield,
  Medal,
} from "lucide-react";
import type { BattleLeaderboardEntry } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminBattlePage() {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;

  const [battle, settings] = await Promise.all([getBattleData(), getSystemSettings()]);

  const s = battle.student;
  const t = battle.teacher;

  const total = s.score + t.score || 1;
  const sPct = Math.round((s.score / total) * 100);
  const tPct = 100 - sPct;

  const students = battle.leaderboard.filter((e) => e.role === "STUDENT").slice(0, 10);
  const teachers = battle.leaderboard.filter((e) => e.role === "TEACHER").slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Battle — O&apos;quvchilar vs O&apos;qituvchilar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kitob o&apos;qish jamoaviy musobaqasi. Faqat{" "}
          <strong className="text-foreground">haqiqiy o&apos;qish</strong> hisoblanadi:
          kamida {settings.minPagesPerRead} sahifa va {settings.minSecondsPerRead} soniya.
          Og&apos;z ochish bilangina ochko olish mumkin emas.
        </p>
      </div>

      {/* ─── CS2 uslubidagi scoreboard ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(120deg,#0f172a,#1e293b)] p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.25),transparent_50%),radial-gradient(circle_at_80%_100%,rgba(168,85,247,0.25),transparent_50%)]" />
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          <TeamLogo
            name="STUDENTS"
            sub="O'quvchilar"
            color="bg-blue-600"
            winner={battle.winner === "STUDENT"}
            size="md"
          />
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-4xl font-black tabular-nums sm:text-5xl">
              <span className={s.score > t.score ? "text-blue-400" : "text-white/50"}>{s.score}</span>
              <Swords className="size-8 text-white/60" />
              <span className={t.score > s.score ? "text-violet-400" : "text-white/50"}>{t.score}</span>
            </div>
            <span
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                battle.winner === "TIE"
                  ? "bg-white/10 text-white"
                  : battle.winner === "STUDENT"
                    ? "bg-blue-600 text-white"
                    : "bg-violet-600 text-white"
              }`}
            >
              <Trophy size={13} />
              {battle.winner === "TIE"
                ? "Durrang"
                : battle.winner === "STUDENT"
                  ? "O'quvchilar lider"
                  : "O'qituvchilar lider"}
            </span>
          </div>
          <TeamLogo
            name="TEACHERS"
            sub="O'qituvchilar"
            color="bg-violet-600"
            winner={battle.winner === "TEACHER"}
            size="md"
          />
        </div>

        {/* Progress */}
        <div className="relative mt-6 flex h-3.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${sPct}%` }} />
          <div className="flex-1 bg-violet-600 transition-all duration-700" style={{ width: `${tPct}%` }} />
        </div>
        <div className="relative mt-1.5 flex justify-between text-xs font-semibold">
          <span className="text-blue-300">{sPct}%</span>
          <span className="text-violet-300">{tPct}%</span>
        </div>
      </div>

      {/* ─── Jamoalar ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamCard data={s} teamLabel="O'quvchilar" accent="blue" />
        <TeamCard data={t} teamLabel="O'qituvchilar" accent="violet" />
      </div>

      {/* ─── Reyting jadvallari ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LeaderboardPanel title="TOP o'quvchilar" entries={students} accent="blue" />
        <LeaderboardPanel title="TOP o'qituvchilar" entries={teachers} accent="violet" />
      </div>
    </div>
  );
}

function TeamLogo({
  name,
  sub,
  color,
  winner,
  size,
}: {
  name: string;
  sub: string;
  color: string;
  winner: boolean;
  size: "md";
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex ${size === "md" ? "h-14 w-14 sm:h-16 sm:w-16" : ""} items-center justify-center rounded-2xl ${color} shadow-lg`}
      >
        <Shield className={size === "md" ? "size-7 sm:size-8" : "size-4"} />
      </div>
      <div className="text-center">
        <p className="text-sm font-black tracking-wide sm:text-base">{name}</p>
        <p className="text-[11px] text-white/60">{sub}</p>
      </div>
      {winner && (
        <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">
          G&apos;OLIB
        </span>
      )}
    </div>
  );
}

function TeamCard({
  data,
  teamLabel,
  accent,
}: {
  data: {
    team: string;
    score: number;
    booksStarted: number;
    booksCompleted: number;
    activeUsers: number;
    pagesRead: number;
    readingSeconds: number;
    sessions: number;
    topUser: { id: string; name: string; group?: string | null; avatar?: string | null } | null;
  };
  teamLabel: string;
  accent: "blue" | "violet";
}) {
  const bar = accent === "blue" ? "bg-blue-600" : "bg-violet-600";
  const text = accent === "blue" ? "text-blue-600 dark:text-blue-400" : "text-violet-600 dark:text-violet-400";
  const rows: [ReactNode, string][] = [
    [<Users2 key="u" size={14} />, `${data.activeUsers} faol o'quvchi`],
    [<BookOpen key="b" size={14} />, `${data.booksStarted} boshlangan`],
    [<BookCheck key="c" size={14} />, `${data.booksCompleted} tugatilgan`],
    [<Flame key="f" size={14} />, `${data.pagesRead.toLocaleString()} sahifa`],
    [<Clock key="t" size={14} />, formatReadable(data.readingSeconds)],
    [<Award key="a" size={14} />, `${data.sessions} valid sessiya`],
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${bar} text-white`}>
            <Shield size={18} />
          </span>
          <div>
            <p className="text-sm font-bold">
              JAMOA {data.team === "STUDENT" ? "STUDENTS" : "TEACHERS"}
            </p>
            <p className="text-[11px] text-muted-foreground">{teamLabel}</p>
          </div>
        </div>
        <div className={`text-right`}>
          <p className={`text-3xl font-black tabular-nums ${text}`}>{data.score}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">ochko</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {rows.map(([icon, label], i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-muted-foreground">{icon} {label}</span>
          </div>
        ))}
      </div>

      {data.topUser && (
        <div className="mt-4 rounded-xl bg-muted/60 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
            <Trophy size={12} /> Jamoa eng yaxshi o&apos;quvchisi
          </p>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
              {data.topUser.avatar ? (
                <img src={data.topUser.avatar} alt={data.topUser.name} className="h-full w-full object-cover" />
              ) : (
                data.topUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{data.topUser.name}</p>
              <p className="text-xs text-muted-foreground">{data.topUser.group ?? ""}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderboardPanel({
  title,
  entries,
  accent,
}: {
  title: string;
  entries: BattleLeaderboardEntry[];
  accent: "blue" | "violet";
}) {
  const bar = accent === "blue" ? "bg-blue-600" : "bg-violet-600";
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className={`mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${accent === "blue" ? "text-blue-600 dark:text-blue-400" : "text-violet-600 dark:text-violet-400"}`}>
        <Medal size={16} /> {title}
      </h2>
      {entries.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Hali ochko to&apos;plamagan — kimdir kitob o&apos;qishni boshlashi kerak 🙂
        </p>
      ) : (
        <ol className="space-y-1.5">
          {entries.map((e) => (
            <li
              key={e.userId + e.rank}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/50"
            >
              <RankBadge rank={e.rank} />
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold">
                {e.avatar ? (
                  <img src={e.avatar} alt={e.name} className="h-full w-full object-cover" />
                ) : (
                  e.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {e.group ?? e.position ?? "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">{e.points}</p>
                <p className="text-[10px] uppercase text-muted-foreground">ochko</p>
              </div>
              <div className={`hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block`}>
                <div className={`h-full ${bar}`} style={{ width: `${Math.min(100, (e.points / (entries[0]?.points || 1)) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-amber-950">1</span>;
  if (rank === 2) return <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-black text-slate-800">2</span>;
  if (rank === 3) return <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-300 text-xs font-black text-orange-900">3</span>;
  return <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{rank}</span>;
}