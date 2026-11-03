"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";

// CSRF double-submit: cookie'ni o'qib, mutation so'rovlarida headerga qo'shamiz.
function getCsrfCookie(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)mbsi_csrf=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      // Asosiy login: username + parol (server tomonda scrypt tekshiruvi,
      // HttpOnly session cookie va CSRF cookie o'rnatiladi).
      login: async (username: string, password: string): Promise<boolean> => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            set({ user: json.data, isAuthenticated: true, isLoading: false });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },

      logout: async () => {
        const csrf = getCsrfCookie();
        const headers: Record<string, string> = {};
        if (csrf) headers["x-csrf-token"] = csrf;
        await fetch("/api/auth/logout", { method: "POST", headers }).catch(() => {});
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      // Sahifa yangilanganda serverdagi sessiyadan foydalanuvchini tiklaydi.
      loadUser: async () => {
        try {
          const res = await fetch("/api/auth/me", { cache: "no-store" });
          const json = await res.json();
          if (json.success && json.data) {
            set({ user: json.data, isAuthenticated: true, isLoading: false });
            return;
          }
        } catch {
          /* tarmoq xatosi — login sahifasiga qaytamiz */
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      setUser: (user) =>
        set({
          user,
          isAuthenticated: Boolean(user),
          isLoading: false,
        }),
    }),
    {
      name: "mbsi-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
