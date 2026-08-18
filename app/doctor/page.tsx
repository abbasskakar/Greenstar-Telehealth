import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import {
  AppointmentCard,
  type AppointmentCardData,
} from "@/components/patterns/appointment-card";
import { RealtimeRefresh } from "@/components/notifications/realtime-refresh";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "emergency", label: "Emergency" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
];

export default async function DoctorHome({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { profile } = await requireRole("doctor");
  const { filter = "all" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select(
      `id, type, status, specialty, chief_complaint, patient_id,
       patient:patients ( full_name, age, gender ),
       vitals ( bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2 )`,
    );

  if (filter === "emergency") query = query.eq("type", "emergency");
  else if (filter === "pending") query = query.eq("status", "pending");
  else if (filter === "completed") query = query.eq("status", "completed");
  else query = query.neq("status", "cancelled");

  const { data } = await query
    .order("type", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50);

  const appts = (data ?? []) as unknown as AppointmentCardData[];

  return (
    <div className="space-y-5">
      <RealtimeRefresh table="appointments" channel="doctor-queue" />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-success" />
            Live queue{profile.specialty ? ` · ${profile.specialty}` : ""}
          </div>
        </div>
        <StatusPill tone={profile.duty === "on_duty" ? "success" : "neutral"}>
          {profile.duty === "on_duty" ? "On Duty" : "Off Duty"}
        </StatusPill>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/doctor" : `/doctor?filter=${f.key}`}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-contrast"
                  : "bg-surface-2 text-muted hover:text-foreground",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {appts.length ? (
        <div className="space-y-3">
          {appts.map((a) => (
            <AppointmentCard
              key={a.id}
              appt={a}
              href={`/doctor/appointments/${a.id}`}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-2">
              <Inbox size={22} />
            </span>
            <p className="text-[15px] font-medium text-foreground">
              No appointments here
            </p>
            <p className="max-w-xs text-sm text-muted">
              New cases from field providers will appear in this queue.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
