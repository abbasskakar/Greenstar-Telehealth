import { MobileShell } from "@/components/layout/mobile-shell";
import { requireRole } from "@/lib/auth/session";

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("public");
  return <MobileShell variant="patient">{children}</MobileShell>;
}
