import Link from "next/link";
import {
  Video,
  UserSearch,
  MessageSquare,
  CalendarDays,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { WaitTimer } from "@/components/patterns/wait-timer";
import type { AppointmentCardData } from "@/components/patterns/appointment-card";

const statusMeta = {
  pending: { tone: "warning", label: "Pending" },
  claimed: { tone: "info", label: "Accepted" },
  in_consult: { tone: "info", label: "In consult" },
  completed: { tone: "success", label: "Completed" },
  cancelled: { tone: "neutral", label: "Cancelled" },
} as const;

export function PatientAppointmentCard({
  appt,
  doctorAvatar,
}: {
  appt: AppointmentCardData;
  doctorAvatar?: string | null;
}) {
  const emergency = appt.type === "emergency";
  const meta = statusMeta[appt.status];
  const assigned = appt.assigned_doctor_name;
  const detailsHref = `/patient/appointments/${appt.id}`;
  const chatHref = `/patient/appointments/${appt.id}/chat`;
  const when = appt.created_at ? new Date(appt.created_at) : null;
  const date = when
    ? when.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
  const time = when
    ? when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Card className="overflow-hidden">
      {emergency && (
        <div className="flex items-center gap-1.5 bg-emergency-soft px-4 py-2 text-xs font-bold uppercase tracking-wide text-emergency">
          <AlertTriangle size={13} /> Emergency
        </div>
      )}

      {/* Header: who + status */}
      <div className="flex items-start gap-3 p-4">
        {assigned ? (
          doctorAvatar ? (
            <Avatar url={doctorAvatar} name={assigned} size={48} />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-contrast">
              <Video size={22} />
            </span>
          )
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border-strong text-muted-2">
            <UserSearch size={22} />
          </span>
        )}

        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`truncate font-bold ${assigned ? "text-foreground" : "italic text-muted"}`}
            >
              {assigned ?? "Awaiting doctor"}
            </p>
            <p className="truncate text-sm text-muted">{appt.specialty}</p>
          </div>
          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Details */}
      <div className="space-y-2.5 px-4 py-3.5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarDays size={16} className="shrink-0 text-muted-2" />
          {date ?? "—"}
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock size={16} className="shrink-0 text-muted-2" />
          {time ?? "—"}
          {appt.status === "pending" && appt.created_at && (
            <span className="ml-auto">
              <WaitTimer since={appt.created_at} />
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Actions */}
      <CardBody className="grid grid-cols-2 gap-2 p-3">
        <Link
          href={chatHref}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-surface-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-3"
        >
          <MessageSquare size={16} /> Message
        </Link>
        <Link
          href={detailsHref}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-contrast shadow-brand transition-colors hover:bg-primary-strong"
        >
          View details <ChevronRight size={16} />
        </Link>
      </CardBody>
    </Card>
  );
}
