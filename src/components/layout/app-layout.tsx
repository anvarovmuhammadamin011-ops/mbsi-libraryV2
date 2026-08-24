"use client";

import type { ReactNode } from "react";
import { StudentSidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { TelegramWebAppProvider } from "@/components/telegram-webapp-provider";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TelegramWebAppProvider>
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <StudentSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="container mx-auto p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
    </TelegramWebAppProvider>
  );
}
