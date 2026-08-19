/* Firebase Cloud Messaging background handler — delivers push when the app
   is closed or in the background. Config values here are public (client) keys. */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA3A7TxUoENO7C0FifKsLTPVIfgrTrsjZU",
  authDomain: "greenstar-f2271.firebaseapp.com",
  projectId: "greenstar-f2271",
  storageBucket: "greenstar-f2271.firebasestorage.app",
  messagingSenderId: "569089912106",
  appId: "1:569089912106:web:c9c1386276f1b04b4cc253",
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
