"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CalendarPlus, AlertTriangle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/constants/specialties";
import { createPublicAppointment } from "@/app/patient/book/actions";

export function BookForm() {
  const router = useRouter();
  const [specialty, setSpecialty] = React.useState<string>("General Medicine");
  const [complaint, setComplaint] = React.useState("");
  const [emergency, setEmergency] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await createPublicAppointment({ specialty, chief_complaint: complaint, emergency });
    setLoading(false);
    if (!res.ok) setError(res.error ?? "Could not book.");
    else setDone(true);
  }

  if (done) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={26} />
          </span>
          <p className="text-lg font-bold text-foreground">Appointment requested</p>
          <p className="max-w-xs text-sm text-muted">A doctor will review your request and respond with a note.</p>
          <Button onClick={() => router.push("/patient")}>Back home</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="specialty">What do you need help with?</Label>
            <Select id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="complaint">Describe your concern</Label>
            <textarea
              id="complaint"
              rows={4}
              maxLength={1000}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Tell the doctor about your symptoms…"
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
                <span className="block font-semibold text-foreground">This is an emergency</span>
                <span className="block text-sm text-muted">Alerts on-duty doctors immediately</span>
              </span>
            </span>
            <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${emergency ? "bg-emergency" : "bg-surface-3"}`}>
              <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${emergency ? "translate-x-5" : ""}`} />
            </span>
          </button>

          {error && (
            <p className="rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{error}</p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            <CalendarPlus size={18} /> {loading ? "Booking…" : "Request appointment"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
