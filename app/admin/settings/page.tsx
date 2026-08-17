import { ComingSoon } from "@/components/patterns/coming-soon";
import { requireRole } from "@/lib/auth/session";

export default async function AdminSettings() {
  await requireRole("admin");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <ComingSoon title="System settings" note="Escalation windows, SMS gateway, and security options are configured here later." />
    </div>
  );
}
