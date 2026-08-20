/* Firebase Cloud Messaging background handler — delivers push when the app
   is closed or in the background. The Firebase web config is passed in via the
   registration query string (from NEXT_PUBLIC_* env vars) so no keys live in
   this committed file. */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

const params = new URL(self.location).searchParams;
firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const data = payload.data || {};
  const urgent = data.type === "emergency" || data.type === "call";
  self.registration.showNotification(n.title || "Greenstar Telehealth", {
    body: n.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: data.appointment_id || undefined,
    renotify: Boolean(data.appointment_id),
    requireInteraction: urgent,
    silent: false,
    vibrate: urgent ? [300, 150, 300, 150, 300] : [200, 100, 200],
    timestamp: Date.now(),
    data,
    actions: [{ action: "view", title: "View details" }],
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const path = data.link || "/notifications";
  const target = new URL(path, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(target).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
