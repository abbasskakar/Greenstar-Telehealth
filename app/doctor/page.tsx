import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { AppointmentCard, type AppointmentCardData } from "@/components/patterns/appointment-card";
import { RealtimeRefresh } from "@/components/notifications/realtime-refresh";
import { DutyToggle } from "@/components/duty/duty-toggle";
import { DutyHeartbeat } from "@/components/duty/duty-heartbeat";
import { DutyReminder } from "@/components/duty/duty-reminder";
import { SpecialtyFilter } from "@/components/doctor/specialty-filter";
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
  searchParams: Promise<{ filter?: string; spec?: string }>;
}) {
  const { profile } = await requireRole("doctor");
  const { filter = "all", spec = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select(
      `id, type, status, specialty, chief_complaint, patient_id, created_at, assigned_doctor_name,
       patient:patients ( full_name, age, gender ),
       vitals ( bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2 )`,
    );

  if (filter === "emergency") query = query.eq("type", "emergency");
  else if (filter === "pending") query = query.eq("status", "pending");
  else if (filter === "completed") query = query.eq("status", "completed");
  else query = query.neq("status", "cancelled");

  if (spec) query = query.eq("specialty", spec);

  const { data } = await query
    .order("type", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50);

  const appts = (data ?? []) as unknown as AppointmentCardData[];

  return (
    <div className="space-y-5">
      <RealtimeRefresh table="appointments" channel="doctor-queue" />
      <DutyHeartbeat />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-success" />
            Live queue{profile.specialty ? ` · ${profile.specialty}` : ""}
          </div>
        </div>
        <DutyToggle initial={profile.duty} />
      </div>

      <DutyReminder initial={profile.duty} />

      <div className="space-y-3">
        <div className="flex gap-1 rounded-full border border-border bg-surface p-1">
          {FILTERS.map((f) => {
            const active = f.key === filter;
            const params = new URLSearchParams();
            if (f.key !== "all") params.set("filter", f.key);
            if (spec) params.set("spec", spec);
            const qs = params.toString();
            return (
              <Link
                key={f.key}
                href={`/doctor${qs ? `?${qs}` : ""}`}
                className={cn(
                  "flex-1 whitespace-nowrap rounded-full px-2 py-1.5 text-center text-[13px] font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-contrast shadow-brand"
                    : "text-muted hover:text-foreground",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <SpecialtyFilter filter={filter} spec={spec} />
      </div>

      {appts.length ? (
        <div className="space-y-3">
          {appts.map((a) => (
            <AppointmentCard key={a.id} appt={a} basePath="/doctor/appointments" view="staff" showVitals />
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
