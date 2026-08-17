import { ComingSoon } from "@/components/patterns/coming-soon";

export default function PatientAppointments() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
      <ComingSoon title="Book & track appointments" note="Self-booking and doctor notes arrive with the appointments module." />
    </div>
  );
}
