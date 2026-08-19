"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, CheckCircle2, CalendarPlus, Loader2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { addPatient } from "@/app/provider/patients/actions";

export function AddPatientForm() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [allergies, setAllergies] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [doneId, setDoneId] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await addPatient({
      full_name: fullName,
      age: age ? Number(age) : null,
      gender,
      contact,
      allergies,
    });
    setLoading(false);
    if (!res.ok) setError(res.error ?? "Could not save.");
    else setDoneId(res.id ?? null);
  }

  if (doneId) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={26} />
          </span>
          <p className="text-lg font-bold text-foreground">Patient registered</p>
          <p className="max-w-xs text-sm text-muted">
            {fullName} is now in your patient list. You can book an appointment for them anytime.
          </p>
          <div className="mt-1 flex w-full max-w-xs flex-col gap-2">
            <Button className="w-full" onClick={() => router.push("/provider/new")}>
              <CalendarPlus size={18} /> Book appointment
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push(`/provider/patients/${doneId}`)}>
              View patient
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => router.push("/provider/patients")}>
              Back to patients
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" placeholder="Patient name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
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
          <div>
            <Label htmlFor="allergies">Allergies (optional)</Label>
            <Input id="allergies" placeholder="e.g. Penicillin" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
          </div>

          {error && (
            <p className="rounded-xl bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{error}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            {loading ? "Saving…" : "Register patient"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
