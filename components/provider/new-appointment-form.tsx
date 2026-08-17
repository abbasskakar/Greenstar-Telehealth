"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  HeartPulse,
  Activity,
  Thermometer,
  Wind,
  Droplet,
  Droplets,
  CheckCircle2,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SPECIALTIES } from "@/lib/constants/specialties";
import { createAppointment } from "@/app/provider/new/actions";
import { cn } from "@/lib/utils";

type PatientOption = { id: string; full_name: string; age: number | null };

const VITAL_FIELDS = [
  { key: "heart_rate", label: "Heart Rate", unit: "bpm", Icon: HeartPulse },
  { key: "temperature_f", label: "Temperature", unit: "°F", Icon: Thermometer },
  { key: "spo2", label: "SpO₂", unit: "%", Icon: Wind },
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", Icon: Droplet },
  { key: "blood_sugar", label: "Blood Sugar", unit: "mg/dL", Icon: Droplets },
] as const;

function num(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function NewAppointmentForm({ patients }: { patients: PatientOption[] }) {
  const router = useRouter();
  const [emergency, setEmergency] = React.useState(false);
  const [mode, setMode] = React.useState<"new" | "existing">(
    patients.length ? "existing" : "new",
  );
  const [patientId, setPatientId] = React.useState(patients[0]?.id ?? "");
  const [fullName, setFullName] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [specialty, setSpecialty] = React.useState<string>("General Medicine");
  const [complaint, setComplaint] = React.useState("");
  const [bpSys, setBpSys] = React.useState("");
  const [bpDia, setBpDia] = React.useState("");
  const [v, setV] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await createAppointment({
      patientId: mode === "existing" ? patientId : undefined,
      patient:
        mode === "new"
          ? {
              full_name: fullName,
              age: num(age),
              gender: gender || undefined,
              contact: contact || undefined,
            }
          : undefined,
      type: emergency ? "emergency" : "regular",
      specialty,
      chief_complaint: complaint || undefined,
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
    if (!res.ok) setError(res.error ?? "Could not create the appointment.");
    else setDone(true);
  }

  if (done) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={26} />
          </span>
          <p className="text-lg font-bold text-foreground">Appointment created</p>
          <p className="max-w-xs text-sm text-muted">
            {emergency
              ? "Marked as EMERGENCY — it now sits at the top of the doctor queue."
              : "It has been added to the doctor queue."}
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => router.push("/provider")}>
              Back home
            </Button>
            <Button onClick={() => router.refresh()}>New appointment</Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Emergency */}
      <Card className={cn(emergency && "border-emergency ring-2 ring-emergency/20")}>
        <CardBody className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                emergency ? "bg-emergency text-white" : "bg-surface-2 text-muted",
              )}
            >
              <AlertTriangle size={20} />
            </span>
            <div>
              <p className="font-semibold text-foreground">Mark as Emergency</p>
              <p className="text-xs text-muted">Bypasses the queue, alerts on-duty doctors</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={emergency}
            onClick={() => setEmergency((s) => !s)}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors",
              emergency ? "bg-emergency" : "bg-surface-3",
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
                emergency ? "left-6" : "left-1",
              )}
            />
          </button>
        </CardBody>
      </Card>

      {/* Patient */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-2">
              Patient
            </p>
            {patients.length > 0 && (
              <div className="flex rounded-lg bg-surface-2 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode("existing")}
                  className={cn(
                    "rounded-md px-3 py-1.5",
                    mode === "existing" ? "bg-surface text-foreground shadow-card" : "text-muted",
                  )}
                >
                  Existing
                </button>
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={cn(
                    "rounded-md px-3 py-1.5",
                    mode === "new" ? "bg-surface text-foreground shadow-card" : "text-muted",
                  )}
                >
                  New
                </button>
              </div>
            )}
          </div>

          {mode === "existing" ? (
            <div>
              <Label htmlFor="patient">Select patient</Label>
              <Select
                id="patient"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                    {p.age != null ? ` · ${p.age} yrs` : ""}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Ahmed Khan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    inputMode="numeric"
                    placeholder="Years"
                    value={age}
                    onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="contact">Contact (optional)</Label>
                <Input
                  id="contact"
                  placeholder="03xx-xxxxxxx"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Consultation */}
      <Card>
        <CardBody className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-2">
            Consultation
          </p>
          <div>
            <Label htmlFor="specialty">Area of consultation</Label>
            <Select
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="complaint">Chief complaint / history</Label>
            <textarea
              id="complaint"
              rows={3}
              maxLength={1000}
              placeholder="Briefly describe symptoms or history…"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-2/60 px-3.5 py-3 text-[15px] text-foreground outline-none transition-colors focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </CardBody>
      </Card>

      {/* Vitals */}
      <Card>
        <CardBody className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-2">
            Vitals <span className="font-medium normal-case text-muted-2">(optional)</span>
          </p>
          <div>
            <Label>Blood Pressure (mmHg)</Label>
            <div className="flex items-center gap-2">
              <Input
                inputMode="numeric"
                placeholder="Systolic"
                value={bpSys}
                onChange={(e) => setBpSys(e.target.value.replace(/\D/g, ""))}
                icon={<Activity size={18} />}
              />
              <span className="text-muted-2">/</span>
              <Input
                inputMode="numeric"
                placeholder="Diastolic"
                value={bpDia}
                onChange={(e) => setBpDia(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {VITAL_FIELDS.map(({ key, label, unit, Icon }) => (
              <div key={key}>
                <Label htmlFor={key}>
                  {label} <span className="font-normal text-muted-2">({unit})</span>
                </Label>
                <Input
                  id={key}
                  inputMode="decimal"
                  value={v[key] ?? ""}
                  onChange={(e) =>
                    setV((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  icon={<Icon size={18} />}
                />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {error && (
        <p className="rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        variant={emergency ? "emergency" : "primary"}
        className="w-full"
        disabled={loading}
      >
        {loading
          ? "Creating…"
          : emergency
            ? "Create Emergency Appointment"
            : "Create Appointment"}
      </Button>
    </form>
  );
}
