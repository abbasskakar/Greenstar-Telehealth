"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { setDuty } from "@/lib/actions/duty";
import { cn } from "@/lib/utils";

export function DutyToggle({
  initial,
}: {
  initial: "on_duty" | "off_duty";
}) {
  const router = useRouter();
  const [duty, setDutyState] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const on = duty === "on_duty";

  async function toggle() {
    const next = on ? "off_duty" : "on_duty";
    setBusy(true);
    setDutyState(next);
    const res = await setDuty(next);
    setBusy(false);
    if (!res.ok) setDutyState(duty);
    else router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      role="switch"
      aria-checked={on}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
        on
          ? "border-transparent bg-success-soft text-success"
          : "border-border bg-surface-2 text-muted",
      )}
    >
      <span
        className={cn(
          "relative h-4 w-7 rounded-full transition-colors",
          on ? "bg-success" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all",
            on ? "left-3.5" : "left-0.5",
          )}
        />
      </span>
      {on ? "On Duty" : "Off Duty"}
    </button>
  );
}
