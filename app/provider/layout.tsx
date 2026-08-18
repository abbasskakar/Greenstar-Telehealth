import { MobileShell } from "@/components/layout/mobile-shell";
import { IncomingCallListener } from "@/components/call/incoming-call";
import { requireRole } from "@/lib/auth/session";

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireRole("provider");
  return (
    <MobileShell variant="provider">
      <IncomingCallListener providerId={profile.id} />
      {children}
    </MobileShell>
  );
}
