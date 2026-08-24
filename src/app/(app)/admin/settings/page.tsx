"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/auth-store";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Info } from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== "ADMIN") return null;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold tracking-tight">⚙️ Sozlamalar</h1>
          <p className="mt-1 text-muted-foreground">Tizim sozlamalari</p>
        </div>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="text-base">Ko'rinish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
                <span className="text-sm">Rejim</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? "Yorug'" : "Qorong'u"} rejimga o'tish
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="text-base">Tizim haqida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Info size={16} className="mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">MBSI Library v0.1.0</p>
                <p className="text-xs text-muted-foreground mt-1">
                  MBSI maktabining raqamli kutubxonasi. Kelajakda MBSI Online
                  Kundalik tizimi bilan integratsiya qilinadi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="text-base">Xavfsizlik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Barcha admin API endpointlari server-side role check qiladi.
              Demo rejimda authentication haqiqiy emas.
            </p>
            <p className="text-sm text-muted-foreground">
              Kelajakda MBSI SSO authentication bilan almashtiriladi.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
