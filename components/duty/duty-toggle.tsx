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

  // Stay in sync when duty changes elsewhere (e.g. the On-Duty reminder).
  React.useEffect(() => {
    const h = (e: Event) => setDutyState((e as CustomEvent).detail);
    window.addEventListener("gs-duty", h);
    return () => window.removeEventListener("gs-duty", h);
  }, []);

  async function toggle() {
    const next = on ? "off_duty" : "on_duty";
    setBusy(true);
    setDutyState(next);
    const res = await setDuty(next);
    setBusy(false);
    if (!res.ok) setDutyState(duty);
    else {
      window.dispatchEvent(new CustomEvent("gs-duty", { detail: next }));
      router.refresh();
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      role="switch"
      aria-checked={on}
      aria-label={on ? "You are On Duty. Tap to go Off Duty." : "You are Off Duty. Tap to go On Duty."}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-60",
        on
          ? "border-success/30 bg-success-soft text-success"
          : "border-border-strong bg-surface-2 text-muted",
      )}
    >
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          on ? "bg-success" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all",
            on ? "left-[1.125rem]" : "left-0.5",
          )}
        />
      </span>
      {on ? "On Duty" : "Off Duty"}
    </button>
  );
}
