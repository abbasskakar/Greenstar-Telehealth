import { UserCog, ClipboardList } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardBody } from "@/components/ui/card";
import { ComingSoon } from "@/components/patterns/coming-soon";
import { AppointmentsMonitor, type MonitorRow } from "@/components/admin/appointments-monitor";
import { TriageList } from "@/components/admin/triage-list";
import type { StaffOption, AssignTarget } from "@/components/admin/assign-modal";

export default async function AdminAppointments() {
  await requireRole("admin");
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: pending }, { data: all }, { data: staff }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, type, specialty, chief_complaint, created_at, assigned_doctor_name, assigned_nurse_name, patient:patients ( full_name )")
      .eq("status", "pending")
      .order("type", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, type, status, specialty, created_at, patient:patients ( full_name )")
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("profiles")
      .select("id, full_name, role, specialty, is_active")
      .in("role", ["doctor", "provider"])
      .eq("is_active", true)
      .order("full_name"),
  ]);

  const staffRows = (staff ?? []) as { id: string; full_name: string; role: string; specialty: string | null }[];
  const doctors: StaffOption[] = staffRows.filter((s) => s.role === "doctor").map((s) => ({ id: s.id, full_name: s.full_name, specialty: s.specialty }));
  const nurses: StaffOption[] = staffRows.filter((s) => s.role === "provider").map((s) => ({ id: s.id, full_name: s.full_name }));

  const triage = ((pending ?? []) as unknown as (AssignTarget & { created_at: string; patient: { full_name: string } | null })[]).map((r) => ({
    id: r.id,
    type: r.type,
    specialty: r.specialty,
    chief_complaint: r.chief_complaint,
    patient_name: (r.patient as { full_name: string } | null)?.full_name ?? null,
    assigned_doctor_name: r.assigned_doctor_name ?? null,
    assigned_nurse_name: r.assigned_nurse_name ?? null,
    created_at: r.created_at,
  }));

  const rows = (all ?? []) as unknown as MonitorRow[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
        <p className="mt-1 text-[15px] text-muted">
          Assign new cases to a doctor (and a nurse if needed), then monitor all appointments.
        </p>
      </div>

      {/* Needs assignment */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
          <UserCog size={18} className="text-primary" /> Needs assignment ({triage.length})
        </h2>
        {triage.length ? (
          <TriageList cases={triage} doctors={doctors} nurses={nurses} />
        ) : (
          <Card>
            <CardBody className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-muted-2">
                <ClipboardList size={20} />
              </span>
              <p className="text-[15px] font-medium text-foreground">All caught up</p>
              <p className="max-w-xs text-sm text-muted">New appointments from providers and patients will appear here to assign.</p>
            </CardBody>
          </Card>
        )}
      </section>

      {/* Full monitor */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">All appointments ({rows.length})</h2>
        {rows.length ? (
          <AppointmentsMonitor rows={rows} />
        ) : (
          <ComingSoon title="No appointments yet" note="Appointments created by providers and patients appear here." />
        )}
      </section>
    </div>
  );
}
