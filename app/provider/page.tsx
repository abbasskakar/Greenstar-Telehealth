import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { DutyHeartbeat } from "@/components/duty/duty-heartbeat";
import { DutyToggle } from "@/components/duty/duty-toggle";
import { type AppointmentCardData } from "@/components/patterns/appointment-card";
import { ProviderAppointmentCard } from "@/components/provider/appointment-card";

type Row = AppointmentCardData & { patient_id: string };

export default async function ProviderHome() {
  const { profile } = await requireRole("provider");
  const firstName = (profile.full_name || "Provider").split(" ")[0];

  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      `id, type, status, specialty, chief_complaint, patient_id, created_at, assigned_doctor_name,
       patient:patients ( full_name, age, gender ),
       vitals ( bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2 )`,
    )
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const appts = (data ?? []) as unknown as Row[];

  return (
    <div className="space-y-6">
      <DutyHeartbeat />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">Welcome back</p>
          <h1 className="text-2xl font-bold text-foreground">{firstName}</h1>
          <p className="mt-1 text-[15px] text-muted">
            Here is your patient overview for today.
          </p>
        </div>
        <DutyToggle initial={profile.duty} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/provider/new">
          <Card interactive className="h-full">
            <CardBody className="flex flex-col gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-contrast">
                <Plus size={22} />
              </span>
              <span className="font-semibold text-foreground">New Appointment</span>
            </CardBody>
          </Card>
        </Link>
        <Link href="/provider/patients">
          <Card interactive className="h-full">
            <CardBody className="flex flex-col gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-primary">
                <Users size={22} />
              </span>
              <span className="font-semibold text-foreground">Patients</span>
            </CardBody>
          </Card>
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">
          Recent Appointments
        </h2>
        {appts.length ? (
          <div className="space-y-3">
            {appts.map((a) => (
              <ProviderAppointmentCard key={a.id} appt={a} />
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-[15px] font-medium text-foreground">
                No appointments yet
              </p>
              <p className="max-w-xs text-sm text-muted">
                Tap <span className="font-semibold text-foreground">New Appointment</span> to record a
                patient&apos;s vitals and reach a doctor.
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
