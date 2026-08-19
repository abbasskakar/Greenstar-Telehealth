import { Sidebar } from "@/components/layout/sidebar";
import { requireRole } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/roles";

export default async function ProgramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole("program_manager");
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar
        variant="program"
        name={profile.full_name || "Program Manager"}
        roleLabel={ROLE_LABEL.program_manager}
      />
      <main id="main-content" className="flex-1 overflow-x-hidden">
        <div className="gs-rise mx-auto max-w-6xl px-5 py-6 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
