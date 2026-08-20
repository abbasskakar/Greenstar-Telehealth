"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X, Circle, Loader2, Trash2, CalendarDays } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { ROLE_LABEL, type Role } from "@/lib/auth/roles";
import {
  getUserDetail,
  deleteStaffUser,
  type UserDetail,
  type UserAppt,
} from "@/app/admin/users/actions";

const statusTone: Record<string, "warning" | "info" | "success" | "neutral"> = {
  pending: "warning",
  claimed: "info",
  in_consult: "info",
  completed: "success",
  cancelled: "neutral",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function UserDetailModal({
  userId,
  currentUserId,
  onClose,
}: {
  userId: string;
  currentUserId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [user, setUser] = React.useState<UserDetail | null>(null);
  const [appts, setAppts] = React.useState<UserAppt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [confirming, setConfirming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getUserDetail(userId);
      if (cancelled) return;
      if (res.ok && res.user) {
        setUser(res.user);
        setAppts(res.appointments ?? []);
      } else setError("Could not load user.");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function remove() {
    setDeleting(true);
    const res = await deleteStaffUser(userId);
    setDeleting(false);
    if (!res.ok) {
      setError(res.error ?? "Could not delete.");
      setConfirming(false);
    } else {
      onClose();
      router.refresh();
    }
  }

  const on = user?.duty === "on_duty";
  const canDelete = user && user.role !== "admin" && user.id !== currentUserId;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with overlapping avatar (non-scrolling) */}
        <div className="relative shrink-0">
          <div className="gs-brand-gradient h-16" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30"
          >
            <X size={18} />
          </button>
          {user && (
            <div className="absolute -bottom-8 left-5">
              <Avatar url={user.avatar_url} name={user.full_name} size={72} className="border-4 border-surface" />
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-10">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : !user ? (
            <p className="py-10 text-center text-sm text-emergency">{error ?? "Not found."}</p>
          ) : (
            <>
              <p className="text-lg font-bold text-foreground">{user.full_name || "Unnamed"}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusPill tone="primary" dot={false}>{ROLE_LABEL[user.role as Role]}</StatusPill>
                {user.specialty && <StatusPill tone="neutral" dot={false}>{user.specialty}</StatusPill>}
                <StatusPill tone={user.is_active ? "success" : "neutral"}>{user.is_active ? "Active" : "Disabled"}</StatusPill>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-border pt-4">
                <Row label="Role" value={ROLE_LABEL[user.role as Role]} />
                {user.specialty && <Row label="Specialty" value={user.specialty} />}
                {user.phone && <Row label="Phone" value={user.phone} />}
                {(user.role === "doctor" || user.role === "provider") && (
                  <Row
                    label="Duty"
                    value={
                      <span className={`flex items-center gap-1.5 ${on ? "text-success" : "text-muted"}`}>
                        <Circle size={9} className={on ? "fill-success text-success" : "fill-muted-2 text-muted-2"} />
                        {on ? "On Duty" : "Off Duty"}
                      </span>
                    }
                  />
                )}
                <Row label="Joined" value={new Date(user.created_at).toLocaleDateString()} />
              </div>

              {/* Activity */}
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                  <CalendarDays size={15} className="text-primary" />
                  {user.role === "doctor" ? "Handled cases" : "Created appointments"} ({appts.length})
                </p>
                {appts.length ? (
                  <ul className="space-y-1.5">
                    {appts.slice(0, 12).map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2/50 px-3 py-2 text-sm">
                        <span className="min-w-0 truncate">
                          {a.specialty}
                          {a.type === "emergency" && <span className="ml-1 text-xs font-bold text-emergency">· EMG</span>}
                          <span className="ml-1 text-xs text-muted-2">{new Date(a.created_at).toLocaleDateString()}</span>
                        </span>
                        <StatusPill tone={statusTone[a.status] ?? "neutral"}>{a.status}</StatusPill>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No appointments.</p>
                )}
              </div>

              {error && <p className="mt-3 text-sm font-medium text-emergency">{error}</p>}

              {/* Delete */}
              {canDelete && (
                <div className="mt-5 border-t border-border pt-4">
                  {!confirming ? (
                    <Button variant="outline" className="w-full text-emergency" onClick={() => setConfirming(true)}>
                      <Trash2 size={18} /> Delete user
                    </Button>
                  ) : (
                    <div className="rounded-xl border border-emergency/40 bg-emergency-soft p-3.5 text-center">
                      <p className="text-sm font-medium text-foreground">Delete {user.full_name} permanently?</p>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)} disabled={deleting}>
                          Keep
                        </Button>
                        <Button className="flex-1 bg-emergency hover:bg-emergency" onClick={remove} disabled={deleting}>
                          {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
