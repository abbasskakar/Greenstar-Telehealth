"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Video, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  claimAppointment,
  updateAppointmentStatus,
} from "@/app/doctor/appointments/actions";
import { startCall } from "@/app/call/actions";

type Status = "pending" | "claimed" | "in_consult" | "completed" | "cancelled";

export function AppointmentActions({
  id,
  status,
  emergency,
}: {
  id: string;
  status: Status;
  emergency: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const res = await fn();
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Something went wrong.");
    else router.refresh();
  }

  return (
    <div className="space-y-2.5">
      {error && (
        <p className="rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">
          {error}
        </p>
      )}

      {status === "pending" && (
        <Button
          size="lg"
          variant={emergency ? "emergency" : "primary"}
          className="w-full"
          disabled={busy}
          onClick={() => run(() => claimAppointment(id))}
        >
          <Check size={18} /> Accept case
        </Button>
      )}

      {(status === "claimed" || status === "in_consult") && (
        <>
          <Button
            size="lg"
            className="w-full"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const res = await startCall(id);
                if (res.ok) router.push(`/call/${res.sessionId}`);
                return res;
              })
            }
          >
            <Video size={18} /> Start video call
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => run(() => updateAppointmentStatus(id, "completed"))}
          >
            <CheckCircle2 size={18} /> Mark completed
          </Button>
        </>
      )}

      {status === "completed" && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-success-soft px-4 py-3 text-sm font-semibold text-success">
          <CheckCircle2 size={18} /> Consultation completed
        </div>
      )}
    </div>
  );
}
