// FCM service worker. Statik fayl emas — Firebase konfiguratsiyasi
// NEXT_PUBLIC_* o'zgaruvchilaridan inlinlanadi, shuning uchun
// `public/sw.js` ichida maxfiy/personal qiymat saqlanmaydi.

const FIREBASE_VERSION = "12.19.0";

export const dynamic = "force-static";

export function GET(): Response {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  };

  const source = `// MBSI Library service worker (avtomatik generatsiya qilinadi — tahrirlash shu sahifa emas)
importScripts(
  "https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js"
);

var FIREBASE_CONFIG = ${JSON.stringify(cfg)};
var CACHE = "mbsi-sw-v2";

self.addEventListener("install", function (e) {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Faqat statik resurslar keshlanadi.
// Navigatsiya (/...), /api/... va /sw.js HECH QACHON keshdan berilmaydi —
// aks holda yangi deploy'dan keyin eski sahifa yoki eski API javobi ko'rinadi.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  var isStaticAsset =
    url.pathname.indexOf("/_next/static/") === 0 ||
    url.pathname.indexOf("/static/") === 0 ||
    url.pathname.indexOf("/icons/") === 0 ||
    url.pathname.indexOf("/logo/") === 0 ||
    url.pathname.indexOf("/covers/") === 0 ||
    url.pathname.indexOf("/fonts/") === 0;
  if (!isStaticAsset) return;

  // Cache-first + fonda yangilash (stale-while-revalidate)
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req)
        .then(function (res) {
          if (res && res.ok && res.type === "basic") {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        })
        .catch(function () { return cached; });
      return cached || network;
    })
  );
});

if (FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId) {
  firebase.initializeApp(FIREBASE_CONFIG);
  var messaging = firebase.messaging();

  messaging.onBackgroundMessage(function (payload) {
    var data = (payload && payload.data) || {};
    var note = (payload && payload.notification) || {};
    return self.registration.showNotification(note.title || data.title || "MBSI Library", {
      body: note.body || data.body || "",
      icon: data.icon || "/icons/icon-192.png",
      badge: data.badge || "/icons/icon-192.png",
      tag: data.tag || data.id || "mbsi-notification",
      renotify: true,
      data: { url: data.url || "/notifications", id: data.id || "" }
    });
  });
}

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || "/notifications";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(target) !== -1 && "focus" in list[i]) {
          list[i].postMessage({ type: "notification-click", url: target });
          return list[i].focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
`;
  return new Response(source, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}