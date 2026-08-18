import { MobileShell } from "@/components/layout/mobile-shell";
import { IncomingCallListener } from "@/components/call/incoming-call";
import { PatientTour } from "@/components/patient/patient-tour";
import { requireRole } from "@/lib/auth/session";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole("public");
  return (
    <MobileShell variant="patient">
      {/* A doctor's call targets the appointment creator (this public user). */}
      <IncomingCallListener providerId={profile.id} />
      <PatientTour />
      {children}
    </MobileShell>
  );
}
