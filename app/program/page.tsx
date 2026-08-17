import { requireRole } from "@/lib/auth/session";
import { ComingSoon } from "@/components/patterns/coming-soon";

export default async function ProgramHome() {
  const { profile } = await requireRole("program_manager");
  const firstName = (profile.full_name || "Manager").split(" ")[0];
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome, {firstName}
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          Program coverage, camps, and donor reporting at a glance.
        </p>
      </div>
      <ComingSoon
        title="Program analytics"
        note="Coverage maps, camp turnout, emergency response times, and donor-ready exports arrive with the reporting and camps modules."
      />
    </div>
  );
}
