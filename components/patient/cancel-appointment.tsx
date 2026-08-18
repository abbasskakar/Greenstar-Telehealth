"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelMyAppointment } from "@/app/patient/actions";

export function CancelAppointmentButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function cancel() {
    setLoading(true);
    setError(null);
    const res = await cancelMyAppointment(id);
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Could not cancel.");
      setConfirming(false);
    } else {
      router.push("/patient");
      router.refresh();
    }
  }

  if (!confirming) {
    return (
      <div>
        <Button variant="outline" className="w-full text-emergency" onClick={() => setConfirming(true)}>
          <XCircle size={18} /> Cancel request
        </Button>
        {error && <p className="mt-2 text-sm font-medium text-emergency">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emergency/40 bg-emergency-soft p-4">
      <p className="text-sm font-medium text-foreground">Cancel this appointment request?</p>
      <p className="mt-1 text-sm text-muted">You can always book a new one later.</p>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setConfirming(false)} disabled={loading}>
          Keep it
        </Button>
        <Button className="flex-1 bg-emergency hover:bg-emergency" onClick={cancel} disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
          {loading ? "Cancelling…" : "Yes, cancel"}
        </Button>
      </div>
    </div>
  );
}
