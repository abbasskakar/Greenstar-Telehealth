"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { getFcmToken } from "@/lib/firebase/client";

/** Once a signed-in user has granted notification permission, register this
 *  device's FCM token so the server can push to it when the app is closed.
 *  Does not prompt — the onboarding tour handles the permission ask. */
export function PushRegister() {
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window === "undefined" || !("Notification" in window)) return;
        if (Notification.permission !== "granted") return;

        const token = await getFcmToken();
        if (!token || cancelled) return;

        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        const uid = data.user?.id;
        if (!uid || cancelled) return;

        await supabase.from("push_tokens").upsert(
          {
            user_id: uid,
            token,
            user_agent: navigator.userAgent.slice(0, 300),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "token" },
        );
      } catch {
        /* push not supported / blocked — in-app realtime still works */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
