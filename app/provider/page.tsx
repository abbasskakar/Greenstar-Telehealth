import Link from "next/link";
import { Plus, Users, HeartPulse, ChevronRight, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { DutyHeartbeat } from "@/components/duty/duty-heartbeat";
import { DutyToggle } from "@/components/duty/duty-toggle";
import { DutyReminder } from "@/components/duty/duty-reminder";
import { AppointmentCard, type AppointmentCardData } from "@/components/patterns/appointment-card";

type Row = AppointmentCardData & { patient_id: string };
type NurseVisit = {
  id: string;
  type: "emergency" | "regular";
  specialty: string | null;
  chief_complaint: string | null;
  patient: { full_name: string } | null;
  vitals: { id: string }[] | null;
};

export default async function ProviderHome() {
  const { profile } = await requireRole("provider");
  const firstName = (profile.full_name || "Provider").split(" ")[0];

  const supabase = await createClient();
  const [{ data }, { data: assigned }] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        `id, type, status, specialty, chief_complaint, patient_id, created_at, assigned_doctor_name,
         patient:patients ( full_name, age, gender ),
         vitals ( bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2 )`,
      )
      .eq("created_by", profile.id)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("appointments")
      .select(`id, type, specialty, chief_complaint, patient:patients ( full_name ), vitals ( id )`)
      .eq("assigned_nurse_id", profile.id)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true }),
  ]);

  const appts = (data ?? []) as unknown as Row[];
  // Assigned vitals visits that still need vitals recorded.
  const visits = ((assigned ?? []) as unknown as NurseVisit[]).filter((v) => !(v.vitals && v.vitals.length));

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

      <DutyReminder initial={profile.duty} />

      {visits.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
            <HeartPulse size={18} className="text-primary" /> Vitals to record ({visits.length})
          </h2>
          <div className="space-y-3">
            {visits.map((v) => (
              <Link key={v.id} href={`/provider/visit/${v.id}`} className="block">
                <Card interactive className="overflow-hidden">
                  {v.type === "emergency" && (
                    <div className="flex items-center gap-1.5 bg-emergency-soft px-4 py-2 text-xs font-bold uppercase tracking-wide text-emergency">
                      <AlertTriangle size={13} /> Emergency
                    </div>
                  )}
                  <CardBody className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-foreground">{v.patient?.full_name ?? "Patient"}</p>
                      <p className="truncate text-sm text-primary">{v.specialty ?? "General"}</p>
                      {v.chief_complaint && <p className="truncate text-sm text-muted">{v.chief_complaint}</p>}
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-contrast shadow-brand">
                      Record <ChevronRight size={15} />
                    </span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

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
              <AppointmentCard key={a.id} appt={a} basePath="/provider/appointments" view="staff" showVitals />
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
