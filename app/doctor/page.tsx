import { requireRole } from "@/lib/auth/session";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Inbox } from "lucide-react";

export default async function DoctorHome() {
  const { profile } = await requireRole("doctor");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              Live updates
            </span>
            {profile.specialty && <span>· {profile.specialty}</span>}
          </div>
        </div>
        <StatusPill tone={profile.duty === "on_duty" ? "success" : "neutral"}>
          {profile.duty === "on_duty" ? "On Duty" : "Off Duty"}
        </StatusPill>
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {["All", "Emergency", "Pending", "Completed"].map((f, i) => (
          <span
            key={f}
            className={
              i === 0
                ? "shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-contrast"
                : "shrink-0 rounded-full bg-surface-2 px-3.5 py-1.5 text-sm font-medium text-muted"
            }
          >
            {f}
          </span>
        ))}
      </div>

      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-2">
            <Inbox size={22} />
          </span>
          <p className="text-[15px] font-medium text-foreground">
            No appointments in your queue
          </p>
          <p className="max-w-xs text-sm text-muted">
            Incoming cases, vitals, and video consultations arrive as we build
            the appointment and emergency modules.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
