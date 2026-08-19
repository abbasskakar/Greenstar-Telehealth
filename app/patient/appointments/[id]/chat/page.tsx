import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserSearch, Stethoscope, Info } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { NotesThread, type Note } from "@/components/notes/notes-thread";
import { fetchAvatars } from "@/lib/avatars";

const statusMeta = {
  pending: { tone: "warning", label: "Pending" },
  claimed: { tone: "info", label: "Accepted" },
  in_consult: { tone: "info", label: "In consult" },
  completed: { tone: "success", label: "Completed" },
  cancelled: { tone: "neutral", label: "Cancelled" },
} as const;

export default async function PatientAppointmentChat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireRole("public");
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, status, specialty, assigned_doctor_name, assigned_doctor_id")
    .eq("id", id)
    .single();
  if (!appt) notFound();

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("appointment_id", id)
    .order("created_at", { ascending: true });

  const meta = statusMeta[appt.status as keyof typeof statusMeta];
  const doctor = appt.assigned_doctor_name as string | null;
  const authorAvatars = await fetchAvatars(supabase, [
    ...(notes ?? []).map((n) => n.author_id),
    appt.assigned_doctor_id,
  ]);
  const doctorAvatar = appt.assigned_doctor_id ? authorAvatars[appt.assigned_doctor_id] : null;

  const chatHeader = (
    <div className="flex items-center gap-3 bg-surface px-4 py-3">
      {doctor ? (
        doctorAvatar ? (
          <Avatar url={doctorAvatar} name={doctor} size={42} />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-contrast">
            <Stethoscope size={20} />
          </span>
        )
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border-strong text-muted-2">
          <UserSearch size={20} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className={`truncate font-bold ${doctor ? "text-foreground" : "italic text-muted"}`}>
          {doctor ?? "Awaiting doctor"}
        </p>
        <p className="truncate text-xs text-muted">{appt.specialty}</p>
      </div>
      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[420px] flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between">
        <Link
          href="/patient/appointments"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
        >
          <ArrowLeft size={16} /> My appointments
        </Link>
        <Link
          href={`/patient/appointments/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <Info size={15} /> Details
        </Link>
      </div>

      <NotesThread
        appointmentId={appt.id}
        currentUserId={user.id}
        initial={(notes ?? []) as Note[]}
        avatars={authorAvatars}
        header={chatHeader}
        fullHeight
      />
    </div>
  );
}
