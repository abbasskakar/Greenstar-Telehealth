"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarPlus,
  MessageSquare,
  Activity,
  Video,
  Pill,
  BellOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type Notif = {
  id: string;
  type: "emergency" | "regular" | "note" | "status" | "call" | "prescription";
  title: string;
  body: string | null;
  patient_name: string | null;
  appointment_id: string | null;
  read_at: string | null;
  created_at: string;
};

const meta = {
  emergency: { Icon: AlertTriangle, cls: "bg-emergency-soft text-emergency" },
  regular: { Icon: CalendarPlus, cls: "bg-info-soft text-info" },
  note: { Icon: MessageSquare, cls: "bg-surface-2 text-muted" },
  status: { Icon: Activity, cls: "bg-warning-soft text-warning" },
  call: { Icon: Video, cls: "bg-success-soft text-success" },
  prescription: { Icon: Pill, cls: "bg-purple-soft text-purple" },
} as const;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "calls", label: "Calls" },
  { key: "appointments", label: "Appointments" },
  { key: "unread", label: "Unread" },
] as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function NotificationList({
  userId,
  userRole,
  initial,
}: {
  userId: string;
  userRole: string;
  initial: Notif[];
}) {
  const router = useRouter();
  const [items, setItems] = React.useState<Notif[]>(initial);
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]["key"]>("all");

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
        .channel(`notif-list:${userId}:${Math.random().toString(36).slice(2)}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => setItems((prev) => [payload.new as Notif, ...prev]),
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

  const unreadCount = items.filter((n) => !n.read_at).length;

  const shown = items.filter((n) => {
    if (filter === "unread") return !n.read_at;
    if (filter === "calls") return n.type === "call";
    if (filter === "appointments") return n.type === "emergency" || n.type === "regular";
    return true;
  });

  async function markAllRead() {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .is("read_at", null);
  }

  async function open(n: Notif) {
    if (!n.read_at) {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: now } : x)));
      const supabase = createClient();
      await supabase.from("notifications").update({ read_at: now }).eq("id", n.id);
    }
    if (!n.appointment_id) return;
    const base: Record<string, string> = {
      doctor: `/doctor/appointments/${n.appointment_id}`,
      provider: `/provider/appointments/${n.appointment_id}`,
      public: `/patient/appointments/${n.appointment_id}`,
      admin: `/admin/appointments`,
    };
    const dest = base[userRole];
    if (dest) router.push(dest);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-contrast"
                  : "bg-surface-2 text-muted hover:text-foreground",
              )}
            >
              {f.label}
              {f.key === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="shrink-0 text-sm font-semibold text-primary hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {shown.length ? (
        <ul className="space-y-2.5">
          {shown.map((n) => {
            const m = meta[n.type];
            const Icon = m.Icon;
            return (
              <li key={n.id}>
                <button
                  onClick={() => open(n)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl border bg-surface p-3.5 text-left shadow-card transition-colors hover:border-primary",
                    n.read_at ? "border-border" : "border-primary/30 bg-primary-soft/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      m.cls,
                    )}
                  >
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-foreground">{n.title}</p>
                      <span className="shrink-0 text-xs text-muted-2">
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {n.patient_name && (
                      <p className="text-sm font-medium text-foreground">
                        {n.patient_name}
                      </p>
                    )}
                    {n.body && <p className="truncate text-sm text-muted">{n.body}</p>}
                  </div>
                  {!n.read_at && (
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-surface-2/40 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-2">
            <BellOff size={22} />
          </span>
          <p className="text-[15px] font-medium text-foreground">You&apos;re all caught up</p>
          <p className="text-sm text-muted">New alerts will appear here in real time.</p>
        </div>
      )}
    </div>
  );
}
