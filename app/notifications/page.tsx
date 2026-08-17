import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";
import { ROLE_HOME } from "@/lib/auth/roles";
import { ComingSoon } from "@/components/patterns/coming-soon";

export default async function NotificationsPage() {
  const session = await getSessionProfile();
  if (!session?.profile) redirect("/login");
  const home = ROLE_HOME[session.profile.role];

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <Link
          href={home}
          aria-label="Back"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold text-foreground">Notifications</h1>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">
        <ComingSoon
          title="Real-time notifications"
          note="Emergency alerts, incoming calls, and new-note notifications arrive with the notifications module."
        />
      </main>
    </div>
  );
}
