import Link from "next/link";
import { CalendarHeart, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { type AppointmentCardData } from "@/components/patterns/appointment-card";
import { PatientAppointmentCard } from "@/components/patient/appointment-card";
import { fetchAvatars } from "@/lib/avatars";

export default async function PatientAppointments() {
  const { profile } = await requireRole("public");
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      `id, type, status, specialty, chief_complaint, patient_id, created_at, assigned_doctor_name, assigned_doctor_id,
       patient:patients ( full_name, age, gender ), vitals ( bp_systolic, bp_diastolic, heart_rate, spo2 )`,
    )
    .eq("created_by", profile.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as (AppointmentCardData & {
    assigned_doctor_id: string | null;
  })[];
  const doctorAvatars = await fetchAvatars(
    supabase,
    rows.map((r) => r.assigned_doctor_id),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
        <Link href="/patient/book"><Button size="sm"><Plus size={18} /> Book</Button></Link>
      </div>
      {rows.length ? (
        <div className="space-y-4">
          {rows.map((a) => (
            <PatientAppointmentCard
              key={a.id}
              appt={a}
              doctorAvatar={a.assigned_doctor_id ? doctorAvatars[a.assigned_doctor_id] : null}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-2"><CalendarHeart size={22} /></span>
            <p className="text-[15px] font-medium text-foreground">No appointments yet</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
