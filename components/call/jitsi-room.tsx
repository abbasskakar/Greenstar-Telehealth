"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { endCall } from "@/app/call/actions";

type JitsiAPI = {
  addEventListener(event: string, cb: () => void): void;
  dispose(): void;
};
type JitsiCtor = new (domain: string, options: Record<string, unknown>) => JitsiAPI;

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiCtor;
  }
}

export function JitsiRoom({
  sessionId,
  roomName,
  displayName,
  returnHref,
}: {
  sessionId: string;
  roomName: string;
  displayName: string;
  returnHref: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    let api: JitsiAPI | undefined;

    function init() {
      if (!window.JitsiMeetExternalAPI || !ref.current) return;
      api = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName,
        parentNode: ref.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startWithAudioMuted: false,
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          SHOW_JITSI_WATERMARK: false,
        },
      });
      api.addEventListener("readyToClose", async () => {
        await endCall(sessionId);
        router.push(returnHref);
      });
    }

    if (window.JitsiMeetExternalAPI) {
      init();
    } else {
      const s = document.createElement("script");
      s.src = "https://meet.jit.si/external_api.js";
      s.async = true;
      s.onload = init;
      document.body.appendChild(s);
    }

    return () => {
      try {
        api?.dispose();
      } catch {
        /* noop */
      }
    };
  }, [roomName, displayName, sessionId, returnHref, router]);

  return <div ref={ref} className="h-dvh w-full bg-black" />;
}
