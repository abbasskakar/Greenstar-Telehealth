import Link from "next/link";
import { Plus, CalendarHeart, Activity } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import {
  AppointmentCard,
  type AppointmentCardData,
} from "@/components/patterns/appointment-card";
import { VitalTrends } from "@/components/patterns/vital-trends";
import type { Vitals } from "@/lib/vitals";

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

  // Vitals across this patient's visits (oldest → newest) for trend sparklines.
  const { data: vitalsData } = await supabase
    .from("vitals")
    .select("bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, hemoglobin, blood_sugar, created_at")
    .order("created_at", { ascending: true })
    .limit(24);
  const vitalSeries = (vitalsData ?? []) as unknown as Vitals[];

  return (
    <div className="space-y-7 pt-1">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted">Welcome</p>
        <h1 className="text-2xl font-bold text-foreground">{firstName}</h1>
        <p className="text-[15px] text-muted">Here is your care overview.</p>
      </div>

      <Link href="/patient/book">
        <Card interactive>
          <CardBody className="flex items-center gap-3.5 py-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-contrast shadow-brand">
              <Plus size={22} />
            </span>
            <span className="text-[15px] font-semibold text-foreground">Book an appointment</span>
          </CardBody>
        </Card>
      </Link>

      {vitalSeries.length >= 2 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
            <Activity size={18} className="text-primary" /> Health trends
          </h2>
          <VitalTrends series={vitalSeries} />
        </div>
      )}

      <div className="pt-2">
        <h2 className="mb-4 text-lg font-bold text-foreground">My Appointments</h2>
        {appts.length ? (
          <div className="space-y-4">
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
