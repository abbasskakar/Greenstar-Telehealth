import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Video,
  UserSearch,
  FileDown,
  Activity,
  CalendarDays,
  Clock,
  AlertTriangle,
  MessageSquare,
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
    .select(
      "id, type, status, specialty, chief_complaint, patient_id, created_at, assigned_doctor_name, assigned_doctor_id, vitals ( * )",
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
  const vitals = (appt.vitals as unknown as Vitals[])?.[0];
  const canCancel = ["pending", "claimed"].includes(appt.status);
  const emergency = appt.type === "emergency";
  const doctor = appt.assigned_doctor_name as string | null;

  const authorAvatars = await fetchAvatars(
    supabase,
    [...(notes ?? []).map((n) => n.author_id), appt.assigned_doctor_id],
  );
  const doctorAvatar = appt.assigned_doctor_id ? authorAvatars[appt.assigned_doctor_id] : null;

  const when = appt.created_at ? new Date(appt.created_at) : null;
  const dateStr = when
    ? when.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })
    : "—";
  const timeStr = when
    ? when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="space-y-5">
      <Link href="/patient/appointments" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> My appointments
      </Link>

      {/* Summary — one clean card */}
      <Card className="overflow-hidden">
        {emergency && (
          <div className="flex items-center gap-1.5 bg-emergency-soft px-4 py-2 text-xs font-bold uppercase tracking-wide text-emergency">
            <AlertTriangle size={13} /> Emergency
          </div>
        )}
        <CardBody className="space-y-4">
          <div className="flex items-start gap-3">
            {doctor ? (
              doctorAvatar ? (
                <Avatar url={doctorAvatar} name={doctor} size={52} />
              ) : (
                <span className="flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-contrast" style={{ width: 52, height: 52 }}>
                  <Stethoscope size={24} />
                </span>
              )
            ) : (
              <span className="flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border-strong text-muted-2" style={{ width: 52, height: 52 }}>
                <UserSearch size={24} />
              </span>
            )}
            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className={`truncate text-lg font-bold ${doctor ? "text-foreground" : "italic text-muted"}`}>
                  {doctor ?? "Awaiting doctor"}
                </h1>
                <p className="truncate text-sm text-muted">{appt.specialty}</p>
              </div>
              <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
            <p className="flex items-center gap-2 text-foreground">
              <CalendarDays size={16} className="shrink-0 text-muted-2" /> {dateStr}
            </p>
            <p className="flex items-center gap-2 text-foreground">
              <Clock size={16} className="shrink-0 text-muted-2" /> {timeStr}
            </p>
          </div>

          {appt.chief_complaint && (
            <div className="border-t border-border pt-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-2">Your concern</p>
              <p className="text-[15px] text-foreground">{appt.chief_complaint}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {vitals && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Activity size={18} className="text-primary" /> Recorded vitals
          </h2>
          <VitalCards vitals={vitals} />
        </section>
      )}

      {(rxList ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Pill size={18} className="text-primary" /> Prescription
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
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <FlaskConical size={18} className="text-primary" /> Lab &amp; diagnostics
          </h2>
          <LabBlock appointmentId={appt.id} labs={(labList ?? []) as Lab[]} canRequest={false} canUpload />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <MessageSquare size={18} className="text-primary" /> Messages
        </h2>
        <NotesThread appointmentId={appt.id} currentUserId={user.id} initial={(notes ?? []) as Note[]} avatars={authorAvatars} />
      </section>

      {canCancel && <CancelAppointmentButton id={appt.id} />}
    </div>
  );
}
