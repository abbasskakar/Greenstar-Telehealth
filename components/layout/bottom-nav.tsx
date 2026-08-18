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
import { useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type NavItem = { href: string; tkey: TKey; icon: LucideIcon };

export type MobileVariant = "provider" | "doctor" | "patient";

const NAVS: Record<MobileVariant, NavItem[]> = {
  provider: [
    { href: "/provider", tkey: "nav_home", icon: Home },
    { href: "/provider/patients", tkey: "nav_patients", icon: Users },
    { href: "/notifications", tkey: "nav_alerts", icon: Bell },
    { href: "/provider/profile", tkey: "nav_profile", icon: UserRound },
  ],
  doctor: [
    { href: "/doctor", tkey: "nav_cases", icon: Home },
    { href: "/doctor/schedule", tkey: "nav_schedule", icon: CalendarClock },
    { href: "/notifications", tkey: "nav_alerts", icon: Bell },
    { href: "/doctor/profile", tkey: "nav_profile", icon: UserRound },
  ],
  patient: [
    { href: "/patient", tkey: "nav_home", icon: Home },
    { href: "/patient/appointments", tkey: "nav_appointments", icon: CalendarHeart },
    { href: "/notifications", tkey: "nav_alerts", icon: Bell },
    { href: "/patient/profile", tkey: "nav_profile", icon: UserRound },
  ],
};

export function BottomNav({ variant }: { variant: MobileVariant }) {
  const pathname = usePathname();
  const { t } = useT();
  const items = NAVS[variant];
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 pb-[env(safe-area-inset-bottom)]">
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
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-2 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active && "bg-primary-soft",
                  )}
                >
                  <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
                </span>
                {t(item.tkey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
