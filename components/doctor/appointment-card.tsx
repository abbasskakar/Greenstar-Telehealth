import Link from "next/link";
import { CalendarDays, Clock, AlertTriangle, UserCheck, ChevronRight, MessageSquare } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { VitalSummary } from "@/components/patterns/vital-cards";
import { WaitTimer } from "@/components/patterns/wait-timer";
import type { AppointmentCardData } from "@/components/patterns/appointment-card";

const statusMeta = {
  pending: { tone: "warning", label: "Pending" },
  claimed: { tone: "info", label: "Accepted" },
  in_consult: { tone: "info", label: "In consult" },
  completed: { tone: "success", label: "Completed" },
  cancelled: { tone: "neutral", label: "Cancelled" },
} as const;

export function DoctorAppointmentCard({ appt }: { appt: AppointmentCardData }) {
  const emergency = appt.type === "emergency";
  const meta = statusMeta[appt.status];
  const p = appt.patient;
  const v = appt.vitals?.[0];
  const detailsHref = `/doctor/appointments/${appt.id}`;
  const chatHref = `/doctor/appointments/${appt.id}/chat`;
  const when = appt.created_at ? new Date(appt.created_at) : null;
  const dateStr = when
    ? when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
    : null;
  const timeStr = when
    ? when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : null;
  const sub = [p?.age != null ? `${p.age} yrs` : null, p?.gender, appt.specialty]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className="overflow-hidden">
      {emergency && (
        <div className="flex items-center gap-1.5 bg-emergency-soft px-4 py-2 text-xs font-bold uppercase tracking-wide text-emergency">
          <AlertTriangle size={13} /> Emergency
        </div>
      )}

      <div className="flex items-start gap-3 p-4">
        <Avatar name={p?.full_name} size={48} />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-bold text-foreground">{p?.full_name ?? "Unknown patient"}</p>
            <p className="truncate text-sm text-muted">{sub || appt.specialty}</p>
          </div>
          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="space-y-2.5 px-4 py-3.5">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <CalendarDays size={16} className="shrink-0 text-muted-2" />
          {dateStr ?? "—"}
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Clock size={16} className="shrink-0 text-muted-2" />
          {timeStr ?? "—"}
          {appt.status === "pending" && appt.created_at && (
            <span className="ml-auto">
              <WaitTimer since={appt.created_at} />
            </span>
          )}
        </div>
        {(appt.status === "claimed" || appt.status === "in_consult") && appt.assigned_doctor_name && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-info">
            <UserCheck size={15} className="shrink-0" /> {appt.assigned_doctor_name}
          </p>
        )}
        {v && <VitalSummary vitals={v} />}
      </div>

      <div className="border-t border-border" />

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
