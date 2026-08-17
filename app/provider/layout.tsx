import { MobileShell } from "@/components/layout/mobile-shell";
import { requireRole } from "@/lib/auth/session";

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("provider");
  return <MobileShell variant="provider">{children}</MobileShell>;
}
