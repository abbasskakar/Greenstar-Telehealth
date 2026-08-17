import { ComingSoon } from "@/components/patterns/coming-soon";

export default function ProviderPatients() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-foreground">Patients</h1>
      <ComingSoon
        title="Patient Registry"
        note="Register patients, capture vitals, and create appointments — arriving in the next module."
      />
    </div>
  );
}
