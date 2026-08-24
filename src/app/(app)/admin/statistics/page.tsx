"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  FileText,
  BookMarked,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEMO_USERS,
  DEMO_BOOKS,
  DEMO_READING_PROGRESS,
  DEMO_RANKINGS,
} from "@/lib/demo-data";

export default function AdminStatisticsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "ADMIN") return null;

  const totalPagesRead = DEMO_READING_PROGRESS.reduce(
    (acc, rp) => acc + rp.currentPage,
    0
  );

  const statistics = [
    {
      title: "Jami foydalanuvchilar",
      value: DEMO_USERS.length,
      icon: <Users className="h-5 w-5" />,
      color: "text-primary",
      bg: "bg-primary/10",
      change: "+12%",
    },
    {
      title: "Jami kitoblar",
      value: DEMO_BOOKS.length,
      icon: <BookOpen className="h-5 w-5" />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      change: "+5%",
    },
    {
      title: "O'qilgan betlar",
      value: totalPagesRead.toLocaleString(),
      icon: <FileText className="h-5 w-5" />,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      change: "+23%",
    },
    {
      title: "O'qish sessiyalari",
      value: 156,
      icon: <BookMarked className="h-5 w-5" />,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      change: "+18%",
    },
    {
      title: "O'rtacha o'qish vaqti",
      value: "45 daqiqa",
      icon: <Clock className="h-5 w-5" />,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      change: "+8%",
    },
    {
      title: "O'rtacha betlar/foydalanuvchi",
      value: Math.round(totalPagesRead / DEMO_USERS.length),
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      change: "+15%",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold tracking-tight">📊 Statistika</h1>
          <p className="mt-1 text-muted-foreground">
            Platforma analitikasi
          </p>
        </div>

        <Tabs defaultValue="overview" className="animate-slide-up">
          <TabsList>
            <TabsTrigger value="overview">Umumiy</TabsTrigger>
            <TabsTrigger value="1day">1 Kun</TabsTrigger>
            <TabsTrigger value="1week">1 Hafta</TabsTrigger>
            <TabsTrigger value="1month">1 Oy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {statistics.map((stat) => (
                <Card key={stat.title}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className={`rounded-xl ${stat.bg} p-3`}>
                      <div className={stat.color}>{stat.icon}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-emerald-500">
                      {stat.change}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Top Students */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  🔥 Eng faol o'quvchilar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {DEMO_RANKINGS.slice(0, 5).map((entry, index) => {
                    const entryUser = DEMO_USERS.find(
                      (u) => u.id === entry.userId
                    );
                    return (
                      <div
                        key={entry.userId}
                        className="flex items-center gap-4 rounded-lg p-3 hover:bg-muted/50"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold">
                          {index === 0
                            ? "🥇"
                            : index === 1
                              ? "🥈"
                              : index === 2
                                ? "🥉"
                                : entry.rank}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {entryUser?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.totalPages.toLocaleString()} bet ·{" "}
                            {entry.totalBooks} kitob
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Summary Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  📈 Oylik xulosa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">1,240</p>
                    <p className="text-xs text-muted-foreground">bet (oylik)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-500">28</p>
                    <p className="text-xs text-muted-foreground">kitob (oylik)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-500">120</p>
                    <p className="text-xs text-muted-foreground">soat (oylik)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="1day">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  Kunlik statistika haqiqiy ma&apos;lumotlar bilan to&apos;ldiriladi
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="1week">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  Haftalik statistika haqiqiy ma&apos;lumotlar bilan to&apos;ldiriladi
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="1month">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  Oylik statistika haqiqiy ma&apos;lumotlar bilan to&apos;ldiriladi
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
