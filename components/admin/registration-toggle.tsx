"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setUserActive } from "@/app/admin/users/actions";
import { cn } from "@/lib/utils";

/** Enable/disable a self-registered patient account, inline. */
export function RegistrationToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [isActive, setIsActive] = React.useState(active);

  async function toggle() {
    setBusy(true);
    const next = !isActive;
    const res = await setUserActive(id, next);
    setBusy(false);
    if (res.ok) {
      setIsActive(next);
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={isActive ? "Click to disable this account" : "Click to enable this account"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
        isActive
          ? "bg-success-soft text-success hover:bg-emergency-soft hover:text-emergency"
          : "bg-surface-2 text-muted hover:bg-success-soft hover:text-success",
      )}
    >
      {busy ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-success" : "bg-muted-2")} />
      )}
      {isActive ? "Active" : "Disabled"}
    </button>
  );
}
