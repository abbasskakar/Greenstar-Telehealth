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
  Activity,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { PrescriptionView, type Prescription } from "@/components/rx/prescription-view";
import { LabBlock, type Lab } from "@/components/rx/lab-block";
import { VitalCards } from "@/components/patterns/vital-cards";
import { DeleteAppointmentButton } from "@/components/patient/delete-appointment";
import { fetchAvatars } from "@/lib/avatars";
import type { Vitals } from "@/lib/vitals";

const statusMeta = {
  pending: { tone: "warning", label: "Pending" },
  claimed: { tone: "info", label: "Accepted" },
  in_consult: { tone: "info", label: "In consult" },
  completed: { tone: "success", label: "Completed" },
  cancelled: { tone: "neutral", label: "Cancelled" },
} as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export default async function PatientAppointmentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("public");
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select(
      `id, type, status, specialty, chief_complaint, created_at, assigned_doctor_name, assigned_doctor_id,
       patient:patients ( full_name, age, gender ), vitals ( * )`,
    )
    .eq("id", id)
    .single();
  if (!appt) notFound();

  const [{ data: rxList }, { data: labList }] = await Promise.all([
    supabase.from("prescriptions").select("*").eq("appointment_id", id).order("created_at", { ascending: false }),
    supabase.from("lab_requests").select("*").eq("appointment_id", id).order("created_at", { ascending: false }),
  ]);

  const meta = statusMeta[appt.status as keyof typeof statusMeta];
  const emergency = appt.type === "emergency";
  const doctor = appt.assigned_doctor_name as string | null;
  const vitals = (appt.vitals as unknown as Vitals[])?.[0];
  const p = appt.patient as unknown as { full_name: string; age: number | null; gender: string | null } | null;
  const canEdit = appt.status === "pending";

  const avatarMap = await fetchAvatars(supabase, [appt.assigned_doctor_id]);
  const doctorAvatar = appt.assigned_doctor_id ? avatarMap[appt.assigned_doctor_id] : null;

  const when = appt.created_at ? new Date(appt.created_at) : null;
  const dateStr = when
    ? when.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })
    : "—";
  const timeStr = when ? when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div className="space-y-5">
      <Link href="/patient/appointments" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> My appointments
      </Link>

      {/* All appointment details — one card */}
      <Card className="overflow-hidden">
        {emergency && (
          <div className="flex items-center gap-1.5 bg-emergency-soft px-4 py-2 text-xs font-bold uppercase tracking-wide text-emergency">
            <AlertTriangle size={13} /> Emergency
          </div>
        )}
        <CardBody className="space-y-4">
          {/* Doctor / awaiting */}
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

          {/* Meta */}
          <div className="space-y-2.5 border-t border-border pt-4">
            <Row label="Type" value={emergency ? "Emergency" : "Regular"} />
            <Row label="Requested" value={dateStr} />
            <Row label="Time" value={timeStr} />
          </div>

          {/* Patient */}
          {p && (
            <div className="space-y-2.5 border-t border-border pt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-2">Patient</p>
              <Row label="Name" value={p.full_name || "—"} />
              <Row label="Age" value={p.age != null ? `${p.age} yrs` : "—"} />
              <Row label="Gender" value={p.gender || "—"} />
            </div>
          )}

          {/* Concern */}
          {appt.chief_complaint && (
            <div className="border-t border-border pt-4">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-2">Concern</p>
              <p className="text-[15px] text-foreground">{appt.chief_complaint}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Message shortcut */}
      <Link href={`/patient/appointments/${id}/chat`} className="block">
        <Button variant="secondary" className="w-full">
          <MessageSquare size={18} /> Open messages
        </Button>
      </Link>

      {vitals && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Activity size={17} className="text-primary" /> Recorded vitals
          </h2>
          <VitalCards vitals={vitals} />
        </section>
      )}

      {(rxList ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Pill size={17} className="text-primary" /> Prescription
          </h2>
          {(rxList ?? []).map((rx) => (
            <div key={rx.id} className="space-y-2">
              <PrescriptionView rx={rx as Prescription} />
              <Link href={`/prescription/${rx.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
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

      {/* Edit + Delete */}
      <div className="space-y-2 border-t border-border pt-5">
        {canEdit && (
          <Link href={`/patient/appointments/${id}/edit`} className="block">
            <Button variant="outline" className="w-full">
              <Pencil size={18} /> Edit appointment
            </Button>
          </Link>
        )}
        <DeleteAppointmentButton id={appt.id} />
      </div>
    </div>
  );
}
