import { requireRole } from "@/lib/server/auth";
import { getBattleData, formatReadable } from "@/lib/server/battle";
import { getSystemSettings } from "@/lib/server/system-settings";
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
  Crown,
  Layers,
} from "lucide-react";
import type { BattleLeaderboardEntry, BattleTeamStats } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminBattlePage() {
  const admin = await requireRole("ADMIN");
  if (!admin) return null;

  const [battle, settings] = await Promise.all([getBattleData(), getSystemSettings()]);

  const s = battle.student;
  const t = battle.staff;

  const total = s.score + t.score || 1;
  const sPct = Math.round((s.score / total) * 100);
  const tPct = 100 - sPct;

  const students = battle.leaderboard.filter((e) => e.role === "STUDENT").slice(0, 10);
  const staffMembers = battle.leaderboard.filter((e) => e.role !== "STUDENT").slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Battle — O&apos;quvchilar vs Xodimlar
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Kitob o&apos;qish jamoaviy musobaqasi. Faqat{" "}
            <strong className="text-foreground">haqiqiy o&apos;qish</strong> hisoblanadi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <RuleChip icon={<Layers size={12} />} label={`min ${settings.minPagesPerRead} sahifa`} />
          <RuleChip icon={<Clock size={12} />} label={`min ${settings.minSecondsPerRead} soniya`} />
          <RuleChip icon={<BookOpen size={12} />} label={`+${settings.battleStartPoints} boshlash`} />
          <RuleChip icon={<BookCheck size={12} />} label={`+${settings.battleCompletePoints} tugatish`} />
        </div>
      </div>

      {/* ─── Scoreboard ─── */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(120deg,#0f172a,#1e293b)] p-5 text-white sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(59,130,246,0.28),transparent_52%),radial-gradient(circle_at_85%_100%,rgba(168,85,247,0.28),transparent_52%)]" />
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
          <TeamIdentity
            name="O'QUVCHILAR"
            sub={`${s.activeUsers} faol`}
            color="bg-blue-600"
            winner={battle.winner === "STUDENT"}
            align="left"
          />
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-4xl font-black tabular-nums sm:text-5xl">
              <span className={s.score >= t.score ? "text-blue-400" : "text-white/50"}>{s.score}</span>
              <Swords className="size-7 text-white/60 sm:size-8" />
              <span className={t.score >= s.score ? "text-violet-400" : "text-white/50"}>{t.score}</span>
            </div>
            <span
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
                battle.winner === "TIE"
                  ? "bg-white/10 text-white"
                  : battle.winner === "STUDENT"
                    ? "bg-blue-600 text-white"
                    : "bg-violet-600 text-white"
              }`}
            >
              <Trophy size={12} />
              {battle.winner === "TIE"
                ? "Durrang"
                : battle.winner === "STUDENT"
                  ? "O'quvchilar lider"
                  : "Xodimlar lider"}
            </span>
          </div>
          <TeamIdentity
            name="XODIMLAR"
            sub={`${t.activeUsers} faol`}
            color="bg-violet-600"
            winner={battle.winner === "STAFF"}
            align="right"
          />
        </div>

        <div className="relative mt-6 flex h-3.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${sPct}%` }} />
          <div className="h-full flex-1 bg-violet-600 transition-all duration-700" style={{ width: `${tPct}%` }} />
        </div>
        <div className="relative mt-1.5 flex justify-between text-xs font-semibold">
          <span className="text-blue-300">{sPct}%</span>
          <span className="text-violet-300">{tPct}%</span>
        </div>
      </div>

      {/* ─── Jamoalar ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamCard data={s} teamLabel="O'quvchilar" accent="blue" />
        <TeamCard data={t} teamLabel="Xodimlar va o'qituvchilar" accent="violet" />
      </div>

      {/* ─── Reyting jadvallari ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LeaderboardPanel title="TOP o'quvchilar" entries={students} accent="blue" />
        <LeaderboardPanel title="TOP xodimlar" entries={staffMembers} accent="violet" />
      </div>
    </div>
  );
}

function RuleChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 font-medium text-muted-foreground">
      {icon}
      {label}
    </span>
  );
}

function TeamIdentity({
  name,
  sub,
  color,
  winner,
  align,
}: {
  name: string;
  sub: string;
  color: string;
  winner: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={`flex flex-col gap-2 ${align === "right" ? "items-end" : "items-start"}`}>
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${color} shadow-lg sm:h-16 sm:w-16`}>
        <Shield className="size-7 sm:size-8" />
      </div>
      <div className={align === "right" ? "text-right" : "text-left"}>
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
  data: BattleTeamStats;
  teamLabel: string;
  accent: "blue" | "violet";
}) {
  const bar = accent === "blue" ? "bg-blue-600" : "bg-violet-600";
  const text = accent === "blue" ? "text-blue-600 dark:text-blue-400" : "text-violet-600 dark:text-violet-400";
  const rows: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: <Users2 size={14} />, label: "Faol a'zolar", value: String(data.activeUsers) },
    { icon: <BookOpen size={14} />, label: "Boshlangan kitob", value: String(data.booksStarted) },
    { icon: <BookCheck size={14} />, label: "Tugatilgan kitob", value: String(data.booksCompleted) },
    { icon: <Flame size={14} />, label: "O'qilgan sahifa", value: data.pagesRead.toLocaleString() },
    { icon: <Clock size={14} />, label: "O'qish vaqti", value: formatReadable(data.readingSeconds) },
    { icon: <Award size={14} />, label: "Valid sessiya", value: String(data.sessions) },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${bar} text-white`}>
            <Shield size={18} />
          </span>
          <div>
            <p className="text-sm font-bold uppercase">{teamLabel}</p>
            <p className="text-[11px] text-muted-foreground">Jamoa statistikasi</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-black tabular-nums ${text}`}>{data.score}</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">ochko</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl bg-muted/50 px-3 py-2">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {r.icon}
              {r.label}
            </span>
            <p className="mt-0.5 text-base font-bold tabular-nums">{r.value}</p>
          </div>
        ))}
      </div>

      {data.topUser && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <Crown size={16} className="shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Jamoa MVP</p>
            <p className="truncate text-sm font-semibold">{data.topUser.name}</p>
          </div>
          <p className="shrink-0 text-xs text-muted-foreground">
            {data.topUser.group ?? data.topUser.staffPosition ?? ""}
          </p>
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
  const text =
    accent === "blue" ? "text-blue-600 dark:text-blue-400" : "text-violet-600 dark:text-violet-400";
  const max = entries[0]?.points || 1;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className={`mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${text}`}>
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
              key={e.userId}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/50"
            >
              <RankBadge rank={e.rank} />
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold">
                {e.avatar ? (
                  <img src={e.avatar} alt={e.name} className="h-full w-full object-cover" />
                ) : (
                  e.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {e.group ?? e.position ?? "—"} · {e.booksCompleted} kitob ·{" "}
                  {e.pagesRead.toLocaleString()} bet
                </p>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${bar}`}
                    style={{ width: `${Math.min(100, (e.points / max) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">{e.points}</p>
                <p className="text-[10px] uppercase text-muted-foreground">ochko</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-amber-950">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-black text-slate-800">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-300 text-xs font-black text-orange-900">
        3
      </span>
    );
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}
