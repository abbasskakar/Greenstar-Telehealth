"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Power, PowerOff, KeyRound } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { ROLE_LABEL, type Role } from "@/lib/auth/roles";
import { setUserActive, resetUserPassword } from "@/app/admin/users/actions";
import { cn } from "@/lib/utils";

export type UserRow = {
  id: string;
  full_name: string;
  role: Role;
  specialty: string | null;
  is_active: boolean;
};

const roleTone: Record<Role, "primary" | "info" | "success" | "warning" | "neutral"> = {
  admin: "primary",
  doctor: "info",
  provider: "success",
  program_manager: "warning",
  public: "neutral",
};

export function UsersTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function toggle(u: UserRow) {
    setBusy(u.id);
    await setUserActive(u.id, !u.is_active);
    setBusy(null);
    router.refresh();
  }

  async function reset(u: UserRow) {
    const pw = window.prompt(`New password for ${u.full_name} (min 8 characters):`);
    if (!pw) return;
    const res = await resetUserPassword(u.id, pw);
    window.alert(res.ok ? "Password reset. Share it with the user." : res.error ?? "Failed.");
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-2">
            <th className="px-5 py-3 font-semibold">Name</th>
            <th className="px-5 py-3 font-semibold">Role</th>
            <th className="px-5 py-3 font-semibold">Specialty</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-0">
              <td className="px-5 py-3.5">
                <span className="font-medium text-foreground">
                  {u.full_name || "—"}
                </span>
                {u.id === currentUserId && (
                  <span className="ml-2 text-xs text-muted-2">(you)</span>
                )}
              </td>
              <td className="px-5 py-3.5">
                <StatusPill tone={roleTone[u.role]} dot={false}>
                  {ROLE_LABEL[u.role]}
                </StatusPill>
              </td>
              <td className="px-5 py-3.5 text-muted">{u.specialty || "—"}</td>
              <td className="px-5 py-3.5">
                <StatusPill tone={u.is_active ? "success" : "neutral"}>
                  {u.is_active ? "Active" : "Disabled"}
                </StatusPill>
              </td>
              <td className="px-5 py-3.5">
                {u.role !== "admin" && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => reset(u)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-primary"
                    >
                      <KeyRound size={14} /> Reset PW
                    </button>
                    <button
                      onClick={() => toggle(u)}
                      disabled={busy === u.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
                        u.is_active
                          ? "text-muted hover:text-emergency"
                          : "text-muted hover:text-success",
                      )}
                    >
                      {u.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                      {u.is_active ? "Disable" : "Enable"}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
