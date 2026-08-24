"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (role: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (role: UserRole): Promise<boolean> => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role }),
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
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      loadUser: async () => {
        try {
          const res = await fetch("/api/auth/me", { cache: "no-store" });
          const json = await res.json();
          if (json.success && json.data) {
            set({ user: json.data, isAuthenticated: true, isLoading: false });
            return;
          }
        } catch {
          /* ignore */
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      setUser: (user) =>
        set({
          user,
          isAuthenticated: Boolean(user),
          isLoading: false,
        }),

      hasRole: (role) => get().user?.role === role,
      isAdmin: () => get().user?.role === "ADMIN",
      isTeacher: () => get().user?.role === "TEACHER",
      isStudent: () => get().user?.role === "STUDENT",
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
