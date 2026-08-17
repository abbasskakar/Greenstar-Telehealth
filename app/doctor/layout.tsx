import { MobileShell } from "@/components/layout/mobile-shell";
import { requireRole } from "@/lib/auth/session";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("doctor");
  return <MobileShell variant="doctor">{children}</MobileShell>;
}
