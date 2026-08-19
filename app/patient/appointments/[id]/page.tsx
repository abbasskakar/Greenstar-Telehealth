import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Stethoscope, FileDown, Activity } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { NotesThread, type Note } from "@/components/notes/notes-thread";
import { PrescriptionView, type Prescription } from "@/components/rx/prescription-view";
import { LabBlock, type Lab } from "@/components/rx/lab-block";
import { VitalCards } from "@/components/patterns/vital-cards";
import { CancelAppointmentButton } from "@/components/patient/cancel-appointment";
import { fetchAvatars } from "@/lib/avatars";
import type { Vitals } from "@/lib/vitals";

const statusMeta = {
  pending: { tone: "warning", label: "Pending" },
  claimed: { tone: "info", label: "Accepted" },
  in_consult: { tone: "info", label: "In consult" },
  completed: { tone: "success", label: "Completed" },
  cancelled: { tone: "neutral", label: "Cancelled" },
} as const;

export default async function PatientAppointmentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireRole("public");
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, type, status, specialty, chief_complaint, patient_id, vitals ( * )")
    .eq("id", id)
    .single();
  if (!appt) notFound();

  const [{ data: notes }, { data: rxList }, { data: labList }] = await Promise.all([
    supabase.from("notes").select("*").eq("appointment_id", id).order("created_at", { ascending: true }),
    supabase.from("prescriptions").select("*").eq("appointment_id", id).order("created_at", { ascending: false }),
    supabase.from("lab_requests").select("*").eq("appointment_id", id).order("created_at", { ascending: false }),
  ]);

  const meta = statusMeta[appt.status as keyof typeof statusMeta];
  const vitals = (appt.vitals as unknown as Vitals[])?.[0];
  const canCancel = ["pending", "claimed"].includes(appt.status);
  const avatars = await fetchAvatars(
    supabase,
    (notes ?? []).map((n) => n.author_id),
  );

  return (
    <div className="space-y-5">
      <Link href="/patient" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> Home
      </Link>

      <Card>
        <CardBody className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Stethoscope size={22} />
            </span>
            <div>
              <h1 className="text-lg font-bold text-foreground">{appt.specialty}</h1>
              {appt.chief_complaint && <p className="text-sm text-muted">{appt.chief_complaint}</p>}
            </div>
          </div>
          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
        </CardBody>
      </Card>

      {vitals && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Activity size={18} className="text-primary" /> Recorded vitals
          </h2>
          <VitalCards vitals={vitals} />
        </div>
      )}

      {(rxList ?? []).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Prescription</h2>
          {(rxList ?? []).map((rx) => (
            <div key={rx.id} className="space-y-2">
              <PrescriptionView rx={rx as Prescription} />
              <Link
                href={`/prescription/${rx.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <FileDown size={16} /> Download / print PDF
              </Link>
            </div>
          ))}
        </div>
      )}

      {(labList ?? []).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Lab &amp; Diagnostics</h2>
          <LabBlock appointmentId={appt.id} labs={(labList ?? []) as Lab[]} canRequest={false} canUpload />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-bold text-foreground">Messages</h2>
        <NotesThread appointmentId={appt.id} currentUserId={user.id} initial={(notes ?? []) as Note[]} avatars={avatars} />
      </div>

      {canCancel && <CancelAppointmentButton id={appt.id} />}
    </div>
  );
}
