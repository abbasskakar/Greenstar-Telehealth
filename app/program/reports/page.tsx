import { requireRole } from "@/lib/auth/session";
import { ReportsView } from "@/components/reports/reports-view";

export default async function ProgramReports() {
  await requireRole("program_manager");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Donor Analytics</h1>
        <p className="mt-1 text-[15px] text-muted">
          Program impact at a glance — exportable for donors.
        </p>
      </div>
      <ReportsView />
    </div>
  );
}
