"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/constants/specialties";
import { updateProviderAppointment } from "@/app/provider/appointments/actions";

export function ProviderEditAppointmentForm({
  id,
  initialSpecialty,
  initialComplaint,
  initialEmergency,
}: {
  id: string;
  initialSpecialty: string;
  initialComplaint: string;
  initialEmergency: boolean;
}) {
  const router = useRouter();
  const [specialty, setSpecialty] = React.useState(initialSpecialty);
  const [complaint, setComplaint] = React.useState(initialComplaint);
  const [emergency, setEmergency] = React.useState(initialEmergency);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await updateProviderAppointment(id, {
      specialty,
      chief_complaint: complaint,
      emergency,
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Could not save.");
      return;
    }
    router.push(`/provider/appointments/${id}`);
    router.refresh();
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="specialty">Specialty</Label>
            <Select id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="complaint">Chief complaint</Label>
            <textarea
              id="complaint"
              rows={4}
              maxLength={1000}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-3 text-[15px] text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25"
            />
          </div>
          <button
            type="button"
            onClick={() => setEmergency((v) => !v)}
            aria-pressed={emergency}
            className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-colors ${
              emergency ? "border-emergency bg-emergency-soft" : "border-border hover:border-border-strong"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${emergency ? "bg-emergency text-white" : "bg-surface-2 text-muted-2"}`}>
                <AlertTriangle size={20} />
              </span>
              <span>
                <span className="block font-semibold text-foreground">Emergency</span>
                <span className="block text-sm text-muted">Alerts on-duty doctors immediately</span>
              </span>
            </span>
            <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${emergency ? "bg-emergency" : "bg-surface-3"}`}>
              <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${emergency ? "translate-x-5" : ""}`} />
            </span>
          </button>

          {error && (
            <p className="rounded-xl bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.push(`/provider/appointments/${id}`)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {loading ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
