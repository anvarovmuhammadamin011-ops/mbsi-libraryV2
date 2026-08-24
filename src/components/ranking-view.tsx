"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { RankingEntry, UserRole } from "@/types";

function Leaderboard({
  entries,
  currentUserId,
}: {
  entries: RankingEntry[];
  currentUserId: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">#</TableHead>
          <TableHead>Ism</TableHead>
          <TableHead className="text-right">Sahifa</TableHead>
          <TableHead className="text-right">Kitob</TableHead>
          <TableHead className="text-right">Vaqt</TableHead>
          <TableHead className="text-right">Streak</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((e) => (
          <TableRow key={e.userId} className={e.userId === currentUserId ? "bg-primary/5" : ""}>
            <TableCell className="font-semibold">{e.rank}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {e.user?.name?.charAt(0)}
                </span>
                <span className="truncate">{e.user?.name}</span>
                {e.userId === currentUserId && <Badge variant="secondary" className="text-[10px]">Siz</Badge>}
              </div>
            </TableCell>
            <TableCell className="text-right">{e.totalPages.toLocaleString()}</TableCell>
            <TableCell className="text-right">{e.totalBooks}</TableCell>
            <TableCell className="text-right">{e.readingTime} daq</TableCell>
            <TableCell className="text-right">{e.streak} kun</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reyting</h1>
        {currentUserRank && (
          <Badge variant="default">Siz: #{currentUserRank}</Badge>
        )}
      </div>
      <Tabs defaultValue={currentRole === "TEACHER" ? "teachers" : "students"}>
        <TabsList>
          <TabsTrigger value="students">O'quvchilar</TabsTrigger>
          <TabsTrigger value="teachers">O'qituvchilar</TabsTrigger>
        </TabsList>
        <TabsContent value="students">
          <Leaderboard entries={students} currentUserId={currentUserId} />
        </TabsContent>
        <TabsContent value="teachers">
          <Leaderboard entries={teachers} currentUserId={currentUserId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
