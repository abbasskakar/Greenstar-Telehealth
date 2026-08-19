import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getSessionProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const PROFILE_PATH: Record<string, string> = {
  public: "/patient/profile",
  provider: "/provider/profile",
  doctor: "/doctor/profile",
};

export async function TopBar() {
  const session = await getSessionProfile();

  let unread = 0;
  if (session?.user) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .is("read_at", null);
    unread = count ?? 0;
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <Logo withWordmark />
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        {session?.user && (
          <NotificationBell userId={session.user.id} initialUnread={unread} />
        )}
        {session?.profile && PROFILE_PATH[session.profile.role] && (
          <Link
            href={PROFILE_PATH[session.profile.role]}
            aria-label="Your profile"
            className="ml-0.5 rounded-full ring-2 ring-transparent transition-shadow hover:ring-primary/30"
          >
            <Avatar
              url={session.profile.avatar_url}
              name={session.profile.full_name}
              size={34}
            />
          </Link>
        )}
      </div>
    </header>
  );
}
