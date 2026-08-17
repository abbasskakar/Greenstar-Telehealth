import { ComingSoon } from "@/components/patterns/coming-soon";
import { requireRole } from "@/lib/auth/session";

export default async function ProgramReports() {
  await requireRole("program_manager");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Reports</h1>
      <ComingSoon title="Donor & KPI reports" note="Automated PDF/Excel reports and DHIS2/FHIR-lite exports arrive in the reporting module." />
    </div>
  );
}
