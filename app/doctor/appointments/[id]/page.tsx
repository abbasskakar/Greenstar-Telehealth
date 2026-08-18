import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserRound, Phone, AlertTriangle } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { VitalCards } from "@/components/patterns/vital-cards";
import { AppointmentActions } from "@/components/doctor/appointment-actions";
import { NotesThread, type Note } from "@/components/notes/notes-thread";
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
  const { user } = await requireRole("doctor");
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

  const [{ data: notes }, { data: consent }, { data: rxList }, { data: labList }] =
    await Promise.all([
      supabase
        .from("notes")
        .select("*")
        .eq("appointment_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("consents")
        .select("granted_by_name, created_at")
        .eq("appointment_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("prescriptions")
        .select("*")
        .eq("appointment_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("lab_requests")
        .select("*")
        .eq("appointment_id", id)
        .order("created_at", { ascending: false }),
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
    <div className="space-y-5">
      <Link
        href="/doctor"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
      >
        <ArrowLeft size={16} /> Queue
      </Link>

      {emergency && (
        <div className="flex items-center gap-2 rounded-xl border border-emergency/30 bg-emergency-soft px-4 py-3 text-sm font-semibold text-emergency">
          <AlertTriangle size={18} /> Emergency case — priority response
        </div>
      )}

      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <UserRound size={26} />
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground">
                  {p?.full_name ?? "Unknown patient"}
                </h1>
                <p className="text-sm text-muted">
                  {[p?.age != null ? `${p.age} yrs` : null, p?.gender, appt.specialty]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          </div>
          {p?.contact && (
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <Phone size={13} /> {p.contact}
            </p>
          )}
        </CardBody>
      </Card>

      {appt.chief_complaint && (
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-2">
            Chief complaint
          </h2>
          <Card>
            <CardBody className="text-[15px] text-foreground">
              {appt.chief_complaint}
            </CardBody>
          </Card>
        </div>
      )}

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

      <ConsentCard
        appointmentId={appt.id}
        patientId={appt.patient_id}
        existing={consent ?? null}
      />

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Prescription</h2>
        {(rxList ?? []).map((rx) => (
          <PrescriptionView key={rx.id} rx={rx as Prescription} />
        ))}
        <PrescriptionForm appointmentId={appt.id} allergies={p?.allergies} />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Lab &amp; Diagnostics</h2>
        <LabBlock
          appointmentId={appt.id}
          labs={(labList ?? []) as Lab[]}
          canRequest
          canUpload
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">Notes</h2>
        <NotesThread
          appointmentId={appt.id}
          currentUserId={user.id}
          initial={(notes ?? []) as Note[]}
        />
      </div>

      <div className="sticky bottom-20 pt-2">
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
