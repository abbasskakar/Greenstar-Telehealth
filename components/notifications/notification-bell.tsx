"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell({
  userId,
  initialUnread,
}: {
  userId: string;
  initialUnread: number;
}) {
  const [unread, setUnread] = React.useState(initialUnread);

  React.useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session?.access_token) {
        await supabase.realtime.setAuth(data.session.access_token);
      }
      if (cancelled) return;
      channel = supabase
        .channel(`notif-bell:${userId}:${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => setUnread((u) => u + 1),
        )
        .subscribe();
      if (cancelled) {
        supabase.removeChannel(channel);
        channel = null;
      }
    })();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-foreground"
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emergency px-1 text-[10px] font-bold text-white ring-2 ring-surface">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
