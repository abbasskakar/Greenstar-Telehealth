import { Activity, CheckCircle2, Timer, CalendarClock } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { DutyToggle } from "@/components/duty/duty-toggle";
import { DutyHeartbeat } from "@/components/duty/duty-heartbeat";
import { AppointmentCard, type AppointmentCardData } from "@/components/patterns/appointment-card";

type Row = AppointmentCardData & {
  claimed_at: string | null;
  call_started_at: string | null;
  completed_at: string | null;
};

function fmtSecs(s: number | null) {
  if (s == null) return "—";
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default async function DoctorSchedule() {
  const { profile } = await requireRole("doctor");
  const supabase = await createClient();

  const { data } = await supabase
    .from("appointments")
    .select(
      `id, type, status, specialty, chief_complaint, patient_id, created_at,
       assigned_doctor_name, claimed_at, call_started_at, completed_at,
       patient:patients ( full_name, age, gender ),
       vitals ( bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2 )`,
    )
    .eq("assigned_doctor_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const active = rows.filter((r) => r.status === "claimed" || r.status === "in_consult");
  const completed = rows.filter((r) => r.status === "completed");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const completedToday = completed.filter(
    (r) => r.completed_at && new Date(r.completed_at) >= todayStart,
  ).length;

  // Avg response: creation → accepted (this doctor's cases)
  const responseTimes = rows
    .filter((r) => r.claimed_at && r.created_at)
    .map((r) => (new Date(r.claimed_at!).getTime() - new Date(r.created_at!).getTime()) / 1000)
    .filter((s) => s >= 0);
  const avgResponse = responseTimes.length
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : null;

  const stats = [
    { label: "Active cases", value: String(active.length), Icon: Activity, cls: "bg-info-soft text-info" },
    { label: "Completed today", value: String(completedToday), Icon: CheckCircle2, cls: "bg-success-soft text-success" },
    { label: "Avg. response", value: fmtSecs(avgResponse), Icon: Timer, cls: "bg-primary-soft text-primary" },
  ];

  return (
    <div className="space-y-6">
      <DutyHeartbeat />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
          <p className="mt-0.5 text-sm text-muted">
            Your accepted cases and consultation history.
          </p>
        </div>
        <DutyToggle initial={profile.duty} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody className="p-4">
              <span className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.cls}`}>
                <s.Icon size={18} />
              </span>
              <p className="font-mono text-xl font-bold tabular-nums text-foreground">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
          <Activity size={18} className="text-info" /> Active now
        </h2>
        {active.length ? (
          <div className="space-y-3">
            {active.map((a) => (
              <AppointmentCard key={a.id} appt={a} basePath="/doctor/appointments" view="staff" showVitals />
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-muted-2">
                <CalendarClock size={20} />
              </span>
              <p className="text-[15px] font-medium text-foreground">No active cases</p>
              <p className="max-w-xs text-sm text-muted">
                Accept a case from your queue and it will appear here.
              </p>
            </CardBody>
          </Card>
        )}
      </section>

      {completed.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
            <CheckCircle2 size={18} className="text-success" /> Completed ({completed.length})
          </h2>
          <div className="space-y-3">
            {completed.slice(0, 20).map((a) => (
              <AppointmentCard key={a.id} appt={a} basePath="/doctor/appointments" view="staff" showVitals />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
