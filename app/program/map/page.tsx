import { requireRole } from "@/lib/auth/session";
import { CoverageView } from "@/components/map/coverage-view";

export default async function ProgramMap() {
  await requireRole("program_manager");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Field Coverage Map</h1>
        <p className="mt-1 text-[15px] text-muted">
          Program reach across the field — for planning and donor reporting.
        </p>
      </div>
      <CoverageView />
    </div>
  );
}
