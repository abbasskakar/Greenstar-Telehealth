"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Invisible helper: refreshes the current route when a table changes. */
export function RealtimeRefresh({
  table,
  channel,
}: {
  table: string;
  channel: string;
}) {
  const router = useRouter();
  React.useEffect(() => {
    const supabase = createClient();
    let ch: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        await supabase.realtime.setAuth(data.session.access_token);
      }
      ch = supabase
        .channel(channel)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => router.refresh(),
        )
        .subscribe();
    })();
    return () => {
      if (ch) supabase.removeChannel(ch);
    };
  }, [table, channel, router]);
  return null;
}
