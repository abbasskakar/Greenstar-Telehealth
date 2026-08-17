import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/patterns/coming-soon";
import { UsersTable, type UserRow } from "@/components/admin/users-table";

export default async function AdminUsers() {
  const { profile } = await requireRole("admin");
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, specialty, is_active")
    .order("created_at", { ascending: false });

  const users = (data ?? []) as UserRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="mt-1 text-[15px] text-muted">
            {users.length} account{users.length === 1 ? "" : "s"} in the system.
          </p>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <UserPlus size={18} />
            Add User
          </Button>
        </Link>
      </div>

      {users.length ? (
        <UsersTable users={users} currentUserId={profile.id} />
      ) : (
        <ComingSoon title="No users yet" note="Add your first doctor or provider to get started." />
      )}
    </div>
  );
}
