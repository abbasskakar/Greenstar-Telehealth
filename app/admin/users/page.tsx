import { ComingSoon } from "@/components/patterns/coming-soon";
import { requireRole } from "@/lib/auth/session";

export default async function AdminUsers() {
  await requireRole("admin");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Users</h1>
      <ComingSoon
        title="User management"
        note="Create and manage doctors, providers, and program managers, assign roles and specialties, and reset passwords — building next."
      />
    </div>
  );
}
