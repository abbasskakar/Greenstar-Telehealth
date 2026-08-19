import { Sidebar } from "@/components/layout/sidebar";
import { PushRegister } from "@/components/push-register";
import { requireRole } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole("admin");
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar
        variant="admin"
        name={profile.full_name || "Administrator"}
        roleLabel={ROLE_LABEL.admin}
      />
      <main id="main-content" className="flex-1 overflow-x-hidden">
        <div className="gs-rise mx-auto max-w-6xl px-5 py-6 sm:px-8">{children}</div>
      </main>
      <PushRegister />
    </div>
  );
}
