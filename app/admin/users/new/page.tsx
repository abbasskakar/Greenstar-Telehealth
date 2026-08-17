import { requireRole } from "@/lib/auth/session";
import { CreateUserForm } from "@/components/admin/create-user-form";

export default async function NewUserPage() {
  await requireRole("admin");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add User</h1>
        <p className="mt-1 text-[15px] text-muted">
          Create a doctor, provider, or program manager account.
        </p>
      </div>
      <CreateUserForm />
    </div>
  );
}
