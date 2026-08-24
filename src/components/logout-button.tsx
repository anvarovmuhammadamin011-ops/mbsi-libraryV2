"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/auth-store";

export function LogoutButton() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuthStore();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900" />
        }
      >
        <LogOut size={16} /> Chiqish
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chiqish</DialogTitle>
          <DialogDescription>
            Haqiqatan ham akkauntingizdan chiqmoqchimisiz?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Bekor qilish
          </Button>
          <Button variant="destructive" onClick={logout}>
            Chiqish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
