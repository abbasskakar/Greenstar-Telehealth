"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Bell,
  UserRound,
  CalendarClock,
  CalendarHeart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

export type MobileVariant = "provider" | "doctor" | "patient";

const NAVS: Record<MobileVariant, NavItem[]> = {
  provider: [
    { href: "/provider", label: "Home", icon: Home },
    { href: "/provider/patients", label: "Patients", icon: Users },
    { href: "/notifications", label: "Alerts", icon: Bell },
    { href: "/provider/profile", label: "Profile", icon: UserRound },
  ],
  doctor: [
    { href: "/doctor", label: "Cases", icon: Home },
    { href: "/doctor/schedule", label: "Schedule", icon: CalendarClock },
    { href: "/notifications", label: "Alerts", icon: Bell },
    { href: "/doctor/profile", label: "Profile", icon: UserRound },
  ],
  patient: [
    { href: "/patient", label: "Home", icon: Home },
    { href: "/patient/appointments", label: "Appointments", icon: CalendarHeart },
    { href: "/notifications", label: "Alerts", icon: Bell },
    { href: "/patient/profile", label: "Profile", icon: UserRound },
  ],
};

export function BottomNav({ variant }: { variant: MobileVariant }) {
  const pathname = usePathname();
  const items = NAVS[variant];
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(11,43,34,0.05)]">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-2 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-16 items-center justify-center rounded-full transition-all",
                    active
                      ? "bg-primary text-primary-contrast shadow-brand"
                      : "text-current",
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
