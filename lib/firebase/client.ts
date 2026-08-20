"use client";

import { getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Registers the FCM service worker and returns this device's push token (or null). */
export async function getFcmToken(): Promise<string | null> {
  try {
    if (!(await isSupported())) return null;
    if (!("serviceWorker" in navigator)) return null;
    if (!config.apiKey) return null;

    const app = getApps().length ? getApps()[0] : initializeApp(config);
    const messaging = getMessaging(app);
    // Pass the (public) web config to the SW via its query string so no keys
    // are hardcoded in the committed service-worker file.
    const swParams = new URLSearchParams({
      apiKey: config.apiKey ?? "",
      authDomain: config.authDomain ?? "",
      projectId: config.projectId ?? "",
      storageBucket: config.storageBucket ?? "",
      messagingSenderId: config.messagingSenderId ?? "",
      appId: config.appId ?? "",
    });
    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${swParams.toString()}`,
    );
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch {
    return null;
  }
}
