import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { NewAppointmentForm } from "@/components/provider/new-appointment-form";

export default async function NewAppointmentPage() {
  const { profile } = await requireRole("provider");
  const supabase = await createClient();
  const [{ data: patientsData }, { data: campsData }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, full_name, age")
      .eq("created_by", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("camps")
      .select("id, title")
      .in("status", ["scheduled", "active"])
      .order("date_start", { ascending: false }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Appointment</h1>
        <p className="mt-1 text-[15px] text-muted">
          Record the patient, complaint, and vitals.
        </p>
      </div>
      <NewAppointmentForm patients={patientsData ?? []} camps={campsData ?? []} />
    </div>
  );
}
