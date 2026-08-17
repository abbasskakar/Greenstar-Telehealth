import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function TopBar({ unread = 0 }: { unread?: number }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <Logo withWordmark />
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-foreground"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emergency ring-2 ring-surface" />
          )}
        </Link>
      </div>
    </header>
  );
}
