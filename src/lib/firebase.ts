// Firebase (mijoz tomoni) — faqat NEXT_PUBLIC_* qiymatlar kerak.
// Konfiguratsiya yo'q bo'lsa `getFirebase()` null qaytaradi — ilova buzilmaydi.
"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);
export const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export function getFirebase(): FirebaseApp | null {
  if (!firebaseConfigured || typeof window === "undefined") return null;
  return getApps().length ? getApp() : initializeApp(config);
}

// Service worker registratsiyasi (FCM orqa fon xabarlari uchun shart).
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}