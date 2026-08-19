"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BellRing, Power, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setDuty } from "@/lib/actions/duty";

/** When a provider/doctor is Off Duty: a one-per-session popup on landing and a
 *  persistent banner, so they don't forget to go On Duty and miss cases. */
export function DutyReminder({ initial }: { initial: "on_duty" | "off_duty" }) {
  const router = useRouter();
  const [duty, setDutyState] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const off = duty === "off_duty";

  // Sync if duty is changed from the toggle (or anywhere).
  React.useEffect(() => {
    const h = (e: Event) => setDutyState((e as CustomEvent).detail);
    window.addEventListener("gs-duty", h);
    return () => window.removeEventListener("gs-duty", h);
  }, []);

  async function goOnDuty() {
    setBusy(true);
    setDutyState("on_duty");
    const res = await setDuty("on_duty");
    setBusy(false);
    if (!res.ok) setDutyState("off_duty");
    else {
      window.dispatchEvent(new CustomEvent("gs-duty", { detail: "on_duty" }));
      router.refresh();
    }
  }

  if (!off) return null;

  return (
    <>
      {/* Persistent banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
          <BellRing size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">You’re Off Duty</p>
          <p className="text-xs text-muted">You won’t receive new cases or calls.</p>
        </div>
        <Button size="sm" onClick={goOnDuty} disabled={busy} className="shrink-0">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
          Go On Duty
        </Button>
      </div>
    </>
  );
}
