// Push bildirishnomalarni yoqish/kapaytirish (FCM orqali).
"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api-client";
import {
  firebaseConfigured,
  getFirebase,
  registerServiceWorker,
  vapidKey,
} from "./firebase";

export type PushState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied"
  | "enabled"
  | "disabled";

export function usePush() {
  const [state, setState] = useState<PushState>("default");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!firebaseConfigured || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setState("unsupported");
      return;
    }
    const perm = Notification.permission;
    setState(perm === "granted" ? "granted" : perm === "denied" ? "denied" : "default");
  }, []);

  const enable = useCallback(async () => {
    if (typeof window === "undefined") return;
    setBusy(true);
    setMessage(null);
    try {
      if (!firebaseConfigured) throw new Error("Firebase sozlanmagan");
      if (!vapidKey) throw new Error("VAPID kaliti kiritilmagan (Firebase console > Web Push certificates)");

      const reg = await registerServiceWorker();
      if (!reg) throw new Error("Service worker qo'llab-quvvatlanmaydi");

      const app = getFirebase();
      if (!app) throw new Error("Firebase ishga tushmadi");

      const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
      if (!(await isSupported())) throw new Error("Bu brauzer push qo'llab-quvvatlamaydi");

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "default");
        setMessage(
          permission === "denied"
            ? "Brauzer ruxsatini rad etgan — sozlamalardan yoqib qo'yishingiz kerak"
            : "Ruxsat berilmadi"
        );
        return;
      }

      const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: reg });
      if (!token) throw new Error("Token olinmadi");

      await api.post("/api/push/subscribe", { endpoint: token });
      setState("enabled");
      setMessage("Bildirishnomalar yoqildi");
    } catch (e) {
      setMessage((e as Error).message || "Xatolik yuz berdi");
      setState((s) => (s === "unsupported" ? s : "default"));
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      const app = getFirebase();
      if (app) {
        const { getMessaging, deleteToken } = await import("firebase/messaging");
        try {
          await deleteToken(getMessaging(app));
        } catch {
          /* token allaqachon o'chirilgan bo'lishi mumkin */
        }
      }
      await api.del("/api/push/subscribe");
      setState("granted");
      setMessage("Bildirishnomalar o'chirildi");
    } catch (e) {
      setMessage((e as Error).message || "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, busy, message, enable, disable };
}