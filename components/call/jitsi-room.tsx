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

// Which Jitsi server to use. Defaults to the public meet.jit.si (which forces a
// moderator login); set NEXT_PUBLIC_JITSI_DOMAIN to your own self-hosted Jitsi
// domain (e.g. "video.greenstar.org") for direct, no-login connections.
const JITSI_DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si";

export function JitsiRoom({
  sessionId,
  roomName,
  displayName,
  returnHref,
  jwt = null,
}: {
  sessionId: string;
  roomName: string;
  displayName: string;
  returnHref: string;
  jwt?: string | null;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    let api: JitsiAPI | undefined;

    function init() {
      if (!window.JitsiMeetExternalAPI || !ref.current) return;
      api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName,
        parentNode: ref.current,
        width: "100%",
        height: "100%",
        ...(jwt ? { jwt } : {}),
        userInfo: { displayName },
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startWithAudioMuted: false,
          // Low-bandwidth resilience for weak field connections:
          // cap send resolution, enable last-N + adaptive layer suspension,
          // and drop to audio-only automatically when the link degrades.
          resolution: 360,
          constraints: { video: { height: { ideal: 360, max: 480, min: 180 } } },
          startVideoMuted: 10,
          enableLayerSuspension: true,
          channelLastN: 2,
          disableAudioLevels: true,
          p2p: { enabled: true },
        },
        interfaceConfigOverwrite: {
          MOBILE_APP_PROMO: false,
          SHOW_JITSI_WATERMARK: false,
          VIDEO_QUALITY_LABEL_DISABLED: false,
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
      s.src = `https://${JITSI_DOMAIN}/external_api.js`;
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
  }, [roomName, displayName, sessionId, returnHref, router, jwt]);

  return <div ref={ref} className="h-dvh w-full bg-black" />;
}
