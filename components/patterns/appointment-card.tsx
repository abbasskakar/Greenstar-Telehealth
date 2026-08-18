import Link from "next/link";
import { ChevronRight, AlertTriangle, UserCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { VitalSummary } from "@/components/patterns/vital-cards";
import { WaitTimer } from "@/components/patterns/wait-timer";
import type { Vitals } from "@/lib/vitals";
import { cn } from "@/lib/utils";

export type AppointmentCardData = {
  id: string;
  type: "emergency" | "regular";
  status: "pending" | "claimed" | "in_consult" | "completed" | "cancelled";
  specialty: string | null;
  chief_complaint: string | null;
  patient: { full_name: string; age: number | null; gender: string | null } | null;
  vitals: Vitals[] | null;
  created_at?: string | null;
  assigned_doctor_name?: string | null;
};

const statusTone = {
  pending: "warning",
  claimed: "info",
  in_consult: "info",
  completed: "success",
  cancelled: "neutral",
} as const;

const statusLabel = {
  pending: "Pending",
  claimed: "Accepted",
  in_consult: "In consult",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;

export function AppointmentCard({
  appt,
  href,
}: {
  appt: AppointmentCardData;
  href: string;
}) {
  const emergency = appt.type === "emergency";
  const v = appt.vitals?.[0];
  const p = appt.patient;

  return (
    <Link href={href} className="block">
      <Card
        className={cn(
          "overflow-hidden transition-colors hover:border-primary",
          emergency && "border-l-4 border-l-emergency",
        )}
      >
        {emergency && (
          <div className="flex items-center gap-1.5 bg-emergency-soft px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-emergency">
            <AlertTriangle size={13} /> Emergency
          </div>
        )}
        <CardBody className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-bold text-foreground">
                {p?.full_name ?? "Unknown patient"}
              </p>
              <p className="text-sm text-muted">
                {[p?.age != null ? `${p.age} yrs` : null, p?.gender, appt.specialty]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <StatusPill tone={statusTone[appt.status]}>
              {statusLabel[appt.status]}
            </StatusPill>
          </div>

          {appt.chief_complaint && (
            <p className="line-clamp-2 text-sm text-muted">{appt.chief_complaint}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {appt.status === "pending" && appt.created_at && (
              <WaitTimer since={appt.created_at} />
            )}
            {(appt.status === "claimed" || appt.status === "in_consult") &&
              appt.assigned_doctor_name && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-info">
                  <UserCheck size={12} /> {appt.assigned_doctor_name}
                </span>
              )}
          </div>

          {v && <VitalSummary vitals={v} />}

          <div className="flex items-center justify-end text-sm font-semibold text-primary">
            View details <ChevronRight size={16} />
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
