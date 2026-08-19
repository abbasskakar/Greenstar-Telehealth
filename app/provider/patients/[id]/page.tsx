import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound, Phone, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VitalCards } from "@/components/patterns/vital-cards";
import { VitalTrends } from "@/components/patterns/vital-trends";
import { type AppointmentCardData } from "@/components/patterns/appointment-card";
import { ProviderAppointmentCard } from "@/components/provider/appointment-card";
import type { Vitals } from "@/lib/vitals";

export default async function PatientProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("provider");
  const supabase = await createClient();

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, age, gender, contact")
    .eq("id", id)
    .single();
  if (!patient) notFound();

  const [{ data: appts }, { data: latest }] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        `id, type, status, specialty, chief_complaint, patient_id, created_at, assigned_doctor_name,
         patient:patients ( full_name, age, gender ),
         vitals ( bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2 )`,
      )
      .eq("patient_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vitals")
      .select("*")
      .eq("patient_id", id)
      .order("captured_at", { ascending: true }),
  ]);

  const appointments = (appts ?? []) as unknown as AppointmentCardData[];
  const series = (latest ?? []) as Vitals[];
  const newest = series.at(-1);

  return (
    <div className="space-y-5">
      <Link
        href="/provider/patients"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Patients
      </Link>

      <Card>
        <CardBody className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
            <UserRound size={30} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-foreground">
              {patient.full_name}
            </h1>
            <p className="text-sm text-muted">
              {[patient.age != null ? `${patient.age} yrs` : null, patient.gender]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
            {patient.contact && (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                <Phone size={13} /> {patient.contact}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {newest && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-foreground">Latest Vitals</h2>
          <VitalCards vitals={newest} />
        </div>
      )}

      <VitalTrends series={series} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Appointments ({appointments.length})
          </h2>
          <Link href="/provider/new">
            <Button size="sm" variant="outline">
              <Plus size={16} /> New
            </Button>
          </Link>
        </div>
        <div className="space-y-3">
          {appointments.map((a) => (
            <ProviderAppointmentCard key={a.id} appt={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
