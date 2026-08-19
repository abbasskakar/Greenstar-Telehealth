import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, AlertTriangle, ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { VitalCards } from "@/components/patterns/vital-cards";
import { AppointmentActions } from "@/components/doctor/appointment-actions";
import { ConsentCard } from "@/components/notes/consent-card";
import { PrescriptionView, type Prescription } from "@/components/rx/prescription-view";
import { PrescriptionForm } from "@/components/rx/prescription-form";
import { LabBlock, type Lab } from "@/components/rx/lab-block";
import type { Vitals } from "@/lib/vitals";

const statusMeta = {
  pending: { tone: "warning", label: "Pending" },
  claimed: { tone: "info", label: "Accepted" },
  in_consult: { tone: "info", label: "In consult" },
  completed: { tone: "success", label: "Completed" },
  cancelled: { tone: "neutral", label: "Cancelled" },
} as const;

export default async function DoctorAppointmentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("doctor");
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select(
      `id, type, status, specialty, chief_complaint, patient_id,
       patient:patients ( full_name, age, gender, contact, allergies ),
       vitals ( * )`,
    )
    .eq("id", id)
    .single();
  if (!appt) notFound();

  const [{ data: consent }, { data: rxList }, { data: labList }] = await Promise.all([
    supabase
      .from("consents")
      .select("granted_by_name, created_at")
      .eq("appointment_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("prescriptions").select("*").eq("appointment_id", id).order("created_at", { ascending: false }),
    supabase.from("lab_requests").select("*").eq("appointment_id", id).order("created_at", { ascending: false }),
  ]);

  const emergency = appt.type === "emergency";
  const p = appt.patient as unknown as {
    full_name: string;
    age: number | null;
    gender: string | null;
    contact: string | null;
    allergies: string | null;
  } | null;
  const vitals = (appt.vitals as unknown as Vitals[])?.[0];
  const meta = statusMeta[appt.status as keyof typeof statusMeta];

  return (
    <div className="space-y-5 pb-4">
      <Link href="/doctor" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Queue
      </Link>

      {emergency && (
        <div className="flex items-center gap-2 rounded-xl border border-emergency/30 bg-emergency-soft px-4 py-3 text-sm font-semibold text-emergency">
          <AlertTriangle size={18} /> Emergency case — priority response
        </div>
      )}

      {/* Patient */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={p?.full_name} size={56} />
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground">{p?.full_name ?? "Unknown patient"}</h1>
                <p className="text-sm text-muted">
                  {[p?.age != null ? `${p.age} yrs` : null, p?.gender, appt.specialty].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          </div>
          {p?.contact && (
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <Phone size={14} /> {p.contact}
            </p>
          )}
          {p?.allergies && (
            <p className="flex items-center gap-1.5 rounded-lg bg-emergency-soft px-3 py-2 text-sm font-medium text-emergency">
              <ShieldAlert size={15} /> Allergies: {p.allergies}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Chief complaint */}
      {appt.chief_complaint && (
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-2">Chief complaint</h2>
          <Card>
            <CardBody className="text-[15px] text-foreground">{appt.chief_complaint}</CardBody>
          </Card>
        </div>
      )}

      {/* Vitals */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">Vitals</h2>
        {vitals ? (
          <VitalCards vitals={vitals} />
        ) : (
          <Card>
            <CardBody className="py-6 text-center text-sm text-muted">
              No vitals were recorded for this appointment.
            </CardBody>
          </Card>
        )}
      </div>

      <ConsentCard appointmentId={appt.id} patientId={appt.patient_id} existing={consent ?? null} />

      {/* Prescription */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Prescription</h2>
        {(rxList ?? []).map((rx) => (
          <PrescriptionView key={rx.id} rx={rx as Prescription} />
        ))}
        <PrescriptionForm appointmentId={appt.id} allergies={p?.allergies} />
      </div>

      {/* Labs */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Lab &amp; Diagnostics</h2>
        <LabBlock appointmentId={appt.id} labs={(labList ?? []) as Lab[]} canRequest canUpload />
      </div>

      {/* Actions */}
      <div className="sticky bottom-4 pt-2">
        <AppointmentActions
          id={appt.id}
          status={appt.status}
          emergency={emergency}
          hasConsent={!!consent}
        />
      </div>
    </div>
  );
}
