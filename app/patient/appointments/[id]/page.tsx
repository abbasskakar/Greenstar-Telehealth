import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  UserSearch,
  FileDown,
  AlertTriangle,
  Stethoscope,
  FlaskConical,
  Pill,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { NotesThread, type Note } from "@/components/notes/notes-thread";
import { PrescriptionView, type Prescription } from "@/components/rx/prescription-view";
import { LabBlock, type Lab } from "@/components/rx/lab-block";
import { CancelAppointmentButton } from "@/components/patient/cancel-appointment";
import { fetchAvatars } from "@/lib/avatars";

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
    .select(
      "id, type, status, specialty, chief_complaint, patient_id, assigned_doctor_name, assigned_doctor_id",
    )
    .eq("id", id)
    .single();
  if (!appt) notFound();

  const [{ data: notes }, { data: rxList }, { data: labList }] = await Promise.all([
    supabase.from("notes").select("*").eq("appointment_id", id).order("created_at", { ascending: true }),
    supabase.from("prescriptions").select("*").eq("appointment_id", id).order("created_at", { ascending: false }),
    supabase.from("lab_requests").select("*").eq("appointment_id", id).order("created_at", { ascending: false }),
  ]);

  const meta = statusMeta[appt.status as keyof typeof statusMeta];
  const canCancel = ["pending", "claimed"].includes(appt.status);
  const emergency = appt.type === "emergency";
  const doctor = appt.assigned_doctor_name as string | null;

  const authorAvatars = await fetchAvatars(supabase, [
    ...(notes ?? []).map((n) => n.author_id),
    appt.assigned_doctor_id,
  ]);
  const doctorAvatar = appt.assigned_doctor_id ? authorAvatars[appt.assigned_doctor_id] : null;

  return (
    <div className="space-y-5">
      {/* Chat header: back + doctor identity */}
      <div className="flex items-center gap-3">
        <Link
          href="/patient/appointments"
          aria-label="Back"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        {doctor ? (
          doctorAvatar ? (
            <Avatar url={doctorAvatar} name={doctor} size={44} />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-contrast">
              <Stethoscope size={22} />
            </span>
          )
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border-strong text-muted-2">
            <UserSearch size={22} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className={`truncate text-lg font-bold ${doctor ? "text-foreground" : "italic text-muted"}`}>
            {doctor ?? "Awaiting doctor"}
          </h1>
          <div className="flex items-center gap-2">
            <p className="truncate text-sm text-muted">{appt.specialty}</p>
            <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
          </div>
        </div>
      </div>

      {emergency && (
        <div className="flex items-center gap-2 rounded-xl border border-emergency/30 bg-emergency-soft px-4 py-2.5 text-sm font-semibold text-emergency">
          <AlertTriangle size={16} /> Emergency request
        </div>
      )}

      {/* Prescription / labs stay accessible if the doctor added them */}
      {(rxList ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Pill size={17} className="text-primary" /> Prescription
          </h2>
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
        </section>
      )}

      {(labList ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <FlaskConical size={17} className="text-primary" /> Lab &amp; diagnostics
          </h2>
          <LabBlock appointmentId={appt.id} labs={(labList ?? []) as Lab[]} canRequest={false} canUpload />
        </section>
      )}

      {/* Messages */}
      <NotesThread
        appointmentId={appt.id}
        currentUserId={user.id}
        initial={(notes ?? []) as Note[]}
        avatars={authorAvatars}
      />

      {canCancel && <CancelAppointmentButton id={appt.id} />}
    </div>
  );
}
