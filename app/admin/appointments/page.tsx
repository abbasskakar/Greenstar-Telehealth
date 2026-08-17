import { ComingSoon } from "@/components/patterns/coming-soon";
import { requireRole } from "@/lib/auth/session";

export default async function AdminAppointments() {
  await requireRole("admin");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
      <ComingSoon title="System-wide appointments" note="Monitor and manage all appointments once the appointments module ships." />
    </div>
  );
}
