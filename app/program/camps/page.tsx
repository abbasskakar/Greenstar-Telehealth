import { ComingSoon } from "@/components/patterns/coming-soon";
import { requireRole } from "@/lib/auth/session";

export default async function ProgramCamps() {
  await requireRole("program_manager");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Camps & Events</h1>
      <ComingSoon title="Camps & community events" note="Schedule camps, log turnout and photos, and link appointments — arriving in the camps module." />
    </div>
  );
}
