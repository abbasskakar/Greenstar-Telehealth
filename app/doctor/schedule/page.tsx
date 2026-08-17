import { ComingSoon } from "@/components/patterns/coming-soon";

export default function DoctorSchedule() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
      <ComingSoon title="Your schedule" note="Upcoming consultations and duty hours arrive with the appointments module." />
    </div>
  );
}
