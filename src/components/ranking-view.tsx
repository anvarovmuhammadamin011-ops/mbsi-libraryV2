"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { RankingEntry, UserRole } from "@/types";

const medalColors = [
  "from-yellow-400 to-amber-500",
  "from-gray-300 to-gray-400",
  "from-orange-300 to-orange-400",
];

function LeaderboardCard({ entry, rank, currentUserId }: { entry: RankingEntry; rank: number; currentUserId: string }) {
  const isMe = entry.userId === currentUserId;
  const isTop3 = rank <= 3;

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-4 transition-all duration-150 ${
        isMe
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card hover:bg-muted/50"
      } ${isTop3 ? "shadow-sm" : ""}`}
    >
      {/* Rank */}
      <div className="w-8 text-center">
        {isTop3 ? (
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white ${medalColors[rank - 1]}`}>
            {rank}
          </span>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {entry.user?.name?.charAt(0)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {entry.user?.name}
          </p>
          {isMe && <Badge variant="secondary" className="shrink-0 text-[10px]">Siz</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {entry.streak > 0 ? `${entry.streak} kunlik ketma-ketlik` : "Yangi boshladi"}
        </p>
      </div>

      {/* Ball stats */}
      <div className="text-right">
        <p className="text-sm font-semibold text-yellow-600">
          {(entry as any).balls?.toFixed(1) ?? '0.0'}
        </p>
        <p className="text-[11px] text-muted-foreground">ball</p>
      </div>
    </div>
  );
}

export function RankingView({
  students,
  teachers,
  currentUserId,
  currentRole,
  currentUserRank,
}: {
  students: RankingEntry[];
  teachers: RankingEntry[];
  currentUserId: string;
  currentRole: UserRole;
  currentUserRank: number | null;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reyting</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Eng faol kitobxonlar
        </p>
      </div>

      {/* Your rank */}
      {currentUserRank && (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            #{currentUserRank}
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Siz hozir {currentUserRank}-o'rindasiz</p>
            <p className="text-xs text-muted-foreground">Davom eting!</p>
          </div>
        </div>
      )}

      <Tabs defaultValue={currentRole === "TEACHER" ? "teachers" : "students"}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="students" className="flex-1 sm:flex-none">O'quvchilar</TabsTrigger>
          <TabsTrigger value="teachers" className="flex-1 sm:flex-none">O'qituvchilar</TabsTrigger>
        </TabsList>
        <TabsContent value="students" className="space-y-2 mt-4">
          {students.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Hali reyting yo'q</p>
          ) : (
            students.map((e, i) => (
              <LeaderboardCard key={e.userId} entry={e} rank={i + 1} currentUserId={currentUserId} />
            ))
          )}
        </TabsContent>
        <TabsContent value="teachers" className="space-y-2 mt-4">
          {teachers.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Hali reyting yo'q</p>
          ) : (
            teachers.map((e, i) => (
              <LeaderboardCard key={e.userId} entry={e} rank={i + 1} currentUserId={currentUserId} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
