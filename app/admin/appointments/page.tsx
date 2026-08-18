import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ComingSoon } from "@/components/patterns/coming-soon";
import {
  AppointmentsMonitor,
  type MonitorRow,
} from "@/components/admin/appointments-monitor";

export default async function AdminAppointments() {
  await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("id, type, status, specialty, created_at, patient:patients ( full_name )")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as MonitorRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
        <p className="mt-1 text-[15px] text-muted">
          {rows.length} appointments system-wide. Completed or cancelled ones can be deleted.
        </p>
      </div>
      {rows.length ? (
        <AppointmentsMonitor rows={rows} />
      ) : (
        <ComingSoon title="No appointments yet" note="Appointments created by providers and patients appear here." />
      )}
    </div>
  );
}
