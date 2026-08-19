"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, AlertTriangle, Loader2, Activity } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/constants/specialties";
import { updateProviderAppointment } from "@/app/provider/appointments/actions";

const VITAL_FIELDS = [
  { key: "heart_rate", label: "Heart Rate", unit: "bpm" },
  { key: "temperature_f", label: "Temperature", unit: "°F" },
  { key: "spo2", label: "SpO₂", unit: "%" },
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL" },
  { key: "blood_sugar", label: "Blood Sugar", unit: "mg/dL" },
] as const;

function num(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export type EditInitial = {
  full_name: string;
  age: string;
  gender: string;
  contact: string;
  specialty: string;
  complaint: string;
  emergency: boolean;
  bpSys: string;
  bpDia: string;
  vitals: Record<string, string>;
};

export function ProviderEditAppointmentForm({
  id,
  initial,
}: {
  id: string;
  initial: EditInitial;
}) {
  const router = useRouter();
  const [fullName, setFullName] = React.useState(initial.full_name);
  const [age, setAge] = React.useState(initial.age);
  const [gender, setGender] = React.useState(initial.gender);
  const [contact, setContact] = React.useState(initial.contact);
  const [specialty, setSpecialty] = React.useState(initial.specialty);
  const [complaint, setComplaint] = React.useState(initial.complaint);
  const [emergency, setEmergency] = React.useState(initial.emergency);
  const [bpSys, setBpSys] = React.useState(initial.bpSys);
  const [bpDia, setBpDia] = React.useState(initial.bpDia);
  const [v, setV] = React.useState<Record<string, string>>(initial.vitals);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await updateProviderAppointment(id, {
      patient: { full_name: fullName, age: num(age), gender, contact },
      specialty,
      chief_complaint: complaint,
      emergency,
      vitals: {
        bp_systolic: num(bpSys),
        bp_diastolic: num(bpDia),
        heart_rate: num(v.heart_rate ?? ""),
        temperature_f: num(v.temperature_f ?? ""),
        spo2: num(v.spo2 ?? ""),
        hemoglobin: num(v.hemoglobin ?? ""),
        blood_sugar: num(v.blood_sugar ?? ""),
      },
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
        <form onSubmit={submit} className="space-y-5">
          {/* Patient */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted-2">Patient details</h2>
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input id="age" inputMode="numeric" placeholder="Years" value={age} onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))} />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="contact">Contact number</Label>
              <Input id="contact" inputMode="tel" placeholder="0300-1234567" value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
          </div>

          {/* Request */}
          <div className="space-y-4 border-t border-border pt-4">
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
                rows={3}
                maxLength={1000}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-3 text-[15px] text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
            </div>
            <button
              type="button"
              onClick={() => setEmergency((x) => !x)}
              aria-pressed={emergency}
              className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-colors ${
                emergency ? "border-emergency bg-emergency-soft" : "border-border hover:border-border-strong"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${emergency ? "bg-emergency text-white" : "bg-surface-2 text-muted-2"}`}>
                  <AlertTriangle size={20} />
                </span>
                <span className="font-semibold text-foreground">Emergency</span>
              </span>
              <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${emergency ? "bg-emergency" : "bg-surface-3"}`}>
                <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${emergency ? "translate-x-5" : ""}`} />
              </span>
            </button>
          </div>

          {/* Vitals */}
          <div className="space-y-4 border-t border-border pt-4">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-2">
              <Activity size={15} /> Vitals
            </h2>
            <div>
              <Label>Blood Pressure (mmHg)</Label>
              <div className="flex items-center gap-2">
                <Input className="min-w-0 flex-1" inputMode="numeric" placeholder="Systolic" value={bpSys} onChange={(e) => setBpSys(e.target.value.replace(/\D/g, ""))} />
                <span className="shrink-0 text-muted-2">/</span>
                <Input className="min-w-0 flex-1" inputMode="numeric" placeholder="Diastolic" value={bpDia} onChange={(e) => setBpDia(e.target.value.replace(/\D/g, ""))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {VITAL_FIELDS.map(({ key, label, unit }) => (
                <div key={key}>
                  <Label htmlFor={key}>
                    {label} <span className="font-normal text-muted-2">({unit})</span>
                  </Label>
                  <Input
                    id={key}
                    inputMode="decimal"
                    value={v[key] ?? ""}
                    onChange={(e) => setV((prev) => ({ ...prev, [key]: e.target.value.replace(/[^\d.]/g, "") }))}
                  />
                </div>
              ))}
            </div>
          </div>

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
