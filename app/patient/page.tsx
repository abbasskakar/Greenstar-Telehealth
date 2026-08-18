import Link from "next/link";
import { Plus, CalendarHeart } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import {
  AppointmentCard,
  type AppointmentCardData,
} from "@/components/patterns/appointment-card";

export default async function PatientHome() {
  const { profile } = await requireRole("public");
  const firstName = (profile.full_name || "there").split(" ")[0];

  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      `id, type, status, specialty, chief_complaint, patient_id, created_at, assigned_doctor_name,
       patient:patients ( full_name, age, gender ),
       vitals ( bp_systolic, bp_diastolic, heart_rate, spo2 )`,
    )
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });

  const appts = (data ?? []) as unknown as AppointmentCardData[];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted">Welcome</p>
        <h1 className="text-2xl font-bold text-foreground">{firstName}</h1>
        <p className="mt-1 text-[15px] text-muted">Here is your care overview.</p>
      </div>

      <Link href="/patient/book">
        <Card className="transition-colors hover:border-primary">
          <CardBody className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-contrast">
              <Plus size={22} />
            </span>
            <span className="text-[15px] font-semibold text-foreground">Book an appointment</span>
          </CardBody>
        </Card>
      </Link>

      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">My Appointments</h2>
        {appts.length ? (
          <div className="space-y-3">
            {appts.map((a) => (
              <AppointmentCard key={a.id} appt={a} href={`/patient/appointments/${a.id}`} />
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-2">
                <CalendarHeart size={22} />
              </span>
              <p className="text-[15px] font-medium text-foreground">No appointments yet</p>
              <p className="max-w-xs text-sm text-muted">Tap “Book an appointment” to reach a doctor.</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
