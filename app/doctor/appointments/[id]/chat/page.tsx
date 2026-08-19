import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Info, AlertTriangle } from "lucide-react";
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

export default async function DoctorAppointmentChat({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user } = await requireRole("doctor");
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, type, status, specialty, patient:patients ( full_name, age, gender )")
    .eq("id", id)
    .single();
  if (!appt) notFound();

  const { data: notes } = await supabase
    .from("notes")
    .select("*")
    .eq("appointment_id", id)
    .order("created_at", { ascending: true });

  const meta = statusMeta[appt.status as keyof typeof statusMeta];
  const p = appt.patient as unknown as { full_name: string; age: number | null; gender: string | null } | null;
  const emergency = appt.type === "emergency";
  const authorAvatars = await fetchAvatars(supabase, (notes ?? []).map((n) => n.author_id));

  const chatHeader = (
    <div className="flex items-center gap-3 bg-surface px-4 py-3">
      <Avatar name={p?.full_name} size={42} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-bold text-foreground">
          {emergency && <AlertTriangle size={14} className="shrink-0 text-emergency" />}
          {p?.full_name ?? "Patient"}
        </p>
        <p className="truncate text-xs text-muted">
          {[p?.age != null ? `${p.age} yrs` : null, p?.gender, appt.specialty].filter(Boolean).join(" · ")}
        </p>
      </div>
      <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between">
        <Link href="/doctor" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
          <ArrowLeft size={16} /> Queue
        </Link>
        <Link href={`/doctor/appointments/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
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
